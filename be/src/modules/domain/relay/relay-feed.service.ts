import { Injectable } from "@nestjs/common"
import type { KeyObject } from "node:crypto"
import type { EntityManager } from "typeorm"
import { InjectClock, type Clock } from "@modules/platform/clock"
import { InjectPrimaryEntityManager, type sql } from "@modules/platform/database"
import { InjectRealtimeHub, type RealtimeHub } from "@modules/platform/realtime"
import { RelayError, RelayErrorCode } from "./errors/relay.error"
import { InjectRelayOptions } from "./relay.decorators"
import type { RelayOptions } from "./relay.options"
import type { DevicePrincipal } from "./relay.contracts"
import { milestoneOf } from "@modules/domain/project"
import type { ManifestRequest, RelayUpload, SignedManifest, UploadReceipt } from "./relay-feed.contracts"
import {
    PROJECT_CHECKS,
    manifestIdOf,
    projectRunOf,
    relayDeviceTopic,
    signManifest,
    signingKeyOf,
    uploadValid,
} from "./relay-feed.policy"
import { INSERT_EVENT } from "./persistence/relay-events.sql"

/** One SQL constant of the relay persistence. */
type SqlText = ReturnType<typeof sql>

@Injectable()
/**
 * The relay feed of one paired device: signed task manifests pushed to it, and the practice events it uploads, stored once
 * per client event id and acknowledged on its push topic. Uploads are practice, never proof (contract.relay.channel).
 */
export class RelayFeedService {
    private readonly key: KeyObject

    constructor(
        @InjectPrimaryEntityManager() private readonly entityManager: EntityManager,
        @InjectClock() private readonly clock: Clock,
        @InjectRealtimeHub() private readonly hub: RealtimeHub,
        @InjectRelayOptions() options: RelayOptions,
    ) {
        this.key = signingKeyOf(options.manifestSigningKey?.reveal() ?? null)
    }

    /**
     * Issues the signed manifest of a task to the device, and pushes it to the device's topic. With a project run request the
     * manifest carries the learner's own test command and the milestone's concepts; without one it carries the default check.
     */
    async manifest(device: DevicePrincipal, taskId: string, request?: ManifestRequest): Promise<SignedManifest> {
        if (!/^[A-Za-z0-9._:/-]{1,100}$/u.test(taskId)) throw new RelayError({ code: RelayErrorCode.PayloadInvalid })
        const milestone = request?.milestone === undefined ? null : milestoneOf(request.milestone)
        const run = milestone === null ? null : projectRunOf({ ...request, milestone })
        if (request?.milestone !== undefined && run === null)
            throw new RelayError({ code: RelayErrorCode.PayloadInvalid })
        const issuedAt = this.clock.now().toISOString()
        const signed = signManifest(
            {
                manifestId: manifestIdOf(device.deviceId, taskId, issuedAt),
                taskId,
                learnerId: device.learnerId,
                deviceId: device.deviceId,
                issuedAt,
                checks: run?.checks ?? PROJECT_CHECKS,
                ...(run === null ? {} : { plan: run.plan }),
            },
            this.key,
        )
        await this.hub.publish(relayDeviceTopic(device.learnerId, device.deviceId), {
            id: `manifest:${signed.body.manifestId}`,
            type: "manifest",
            manifest: signed,
        })
        return signed
    }

    /**
     * Stores one upload of the device once per client event id and acknowledges it on the device's topic; a resend stores
     * nothing and is acknowledged again, so a CLI that lost the ack clears its queue.
     */
    async upload(device: DevicePrincipal, upload: RelayUpload): Promise<UploadReceipt> {
        if (!uploadValid(upload)) throw new RelayError({ code: RelayErrorCode.PayloadInvalid })
        await this.write(INSERT_EVENT, [
            device.deviceId,
            upload.eventId,
            device.learnerId,
            upload.kind,
            upload.taskId,
            upload.runId,
            upload.checkId ?? null,
            upload.conceptId ?? null,
            upload.slot ?? null,
            upload.ref ?? null,
            upload.passed ?? null,
            upload.exitCode ?? null,
            upload.durationMs ?? null,
            upload.commit ?? null,
            (upload.kind === "manifest.ack" ? upload.manifestId : upload.text) ?? null,
            this.clock.now(),
        ])
        await this.hub.publish(relayDeviceTopic(device.learnerId, device.deviceId), {
            id: `ack:${upload.eventId}`,
            type: "ack",
            eventId: upload.eventId,
        })
        return { eventId: upload.eventId, accepted: true }
    }

    /** Runs one write; a failed write answers the relay unavailable. */
    private async write(statement: SqlText, params: ReadonlyArray<unknown>): Promise<void> {
        await this.entityManager.query(statement, [...params]).catch((cause: unknown) => {
            throw new RelayError({ code: RelayErrorCode.Unavailable, cause })
        })
    }
}
