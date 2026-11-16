import { Injectable, Optional } from "@nestjs/common"
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
import { LessonContentService, LessonSourceService, type LessonSourcePack } from "@modules/domain/lesson"
import { RelayLessonService } from "./relay-lesson.service"
import {
    LESSON_SOURCE_MAX_BYTES,
    lessonIdOfTask,
    lessonManifestOf,
    lessonSourcePathOf,
    tierBelow,
} from "./relay-lesson-manifest.policy"
import type {
    ManifestLesson,
    ManifestRequest,
    RelayUpload,
    SignedManifest,
    UploadReceipt,
} from "./relay-feed.contracts"
import {
    PROJECT_CHECKS,
    manifestIdOf,
    projectRunOf,
    relayDeviceTopic,
    resultDetailOf,
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
        @Optional() private readonly lessons?: RelayLessonService,
        @Optional() private readonly content?: LessonContentService,
        @Optional() private readonly sources?: LessonSourceService,
    ) {
        this.key = signingKeyOf(options.manifestSigningKey?.reveal() ?? null)
    }

    /**
     * Issues the signed manifest of a task to the device, and pushes it to the device's topic. With a project run request the
     * manifest carries the learner's own test command and the milestone's concepts; without one it carries the default check.
     * A lesson task (`lesson:<slug>`) carries no check and the signed lesson section instead (SCENARIO-CONTRACT v2): Premium
     * is needed, and a challenge tier only once the hidden scenarios of the tier below are all green.
     */
    async manifest(device: DevicePrincipal, taskId: string, request?: ManifestRequest): Promise<SignedManifest> {
        if (!/^[A-Za-z0-9._:/-]{1,100}$/u.test(taskId)) throw new RelayError({ code: RelayErrorCode.PayloadInvalid })
        const milestone = request?.milestone === undefined ? null : milestoneOf(request.milestone)
        const run = milestone === null ? null : projectRunOf({ ...request, milestone })
        if (request?.milestone !== undefined && run === null)
            throw new RelayError({ code: RelayErrorCode.PayloadInvalid })
        const lesson = await this.lessonSection(device, taskId, request)
        const issuedAt = this.clock.now().toISOString()
        const signed = signManifest(
            {
                manifestId: manifestIdOf(device.deviceId, taskId, issuedAt),
                taskId,
                learnerId: device.learnerId,
                deviceId: device.deviceId,
                issuedAt,
                checks: lesson === null ? (run?.checks ?? PROJECT_CHECKS) : [],
                ...(run === null ? {} : { plan: run.plan }),
                ...(lesson === null ? {} : { lesson }),
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

    /** The signed lesson section of a lesson task, or null for any other task; refuses what the learner may not run. */
    private async lessonSection(
        device: DevicePrincipal,
        taskId: string,
        request: ManifestRequest | undefined,
    ): Promise<ManifestLesson | null> {
        const lessonId = lessonIdOfTask(taskId)
        if (lessonId === null) {
            if (request?.scenario !== undefined || request?.challenge !== undefined)
                throw new RelayError({ code: RelayErrorCode.PayloadInvalid })
            return null
        }
        if (this.content === undefined || this.lessons === undefined)
            throw new RelayError({ code: RelayErrorCode.LessonNotRunnable })
        await this.content.requireAccess({ learnerId: device.learnerId, phase: "apply", isPremium: undefined })
        const stored = await this.content.runnable(lessonId)
        if (stored === null) throw new RelayError({ code: RelayErrorCode.LessonNotRunnable })
        const below = request?.challenge === undefined ? null : tierBelow(request.challenge)
        const belowIds =
            below === null
                ? []
                : (stored.essential.challenges.find((each) => each.level === below)?.hidden ?? []).map(
                      (each) => each.id,
                  )
        const isBelowGreen = await this.lessons.allGreen(device.learnerId, lessonId, belowIds)
        const link =
            stored.source === null || stored.source.content.length > LESSON_SOURCE_MAX_BYTES
                ? null
                : { url: lessonSourcePathOf(lessonId), sha256: stored.source.sha256, commit: stored.version }
        const result = lessonManifestOf(
            lessonId,
            stored.essential,
            { scenario: request?.scenario, challenge: request?.challenge },
            () => isBelowGreen,
            link,
        )
        if (result.kind === "locked") throw new RelayError({ code: RelayErrorCode.ChallengeLocked })
        if (result.kind === "not-runnable") throw new RelayError({ code: RelayErrorCode.LessonNotRunnable })
        return result.lesson
    }

    /**
     * The `source/` tarball of the live version of a lesson for a paired device whose learner may study it (Premium), the
     * same bytes the manifest signed the sha256 of (cached by lesson and content commit). It holds the contents of `source/`
     * only, never `hidden/`; no learner-supplied path or commit is read.
     */
    async sourceDownload(device: DevicePrincipal, lessonId: string): Promise<LessonSourcePack> {
        if (!/^[a-z0-9-]{1,100}$/u.test(lessonId)) throw new RelayError({ code: RelayErrorCode.PayloadInvalid })
        if (this.content === undefined || this.sources === undefined)
            throw new RelayError({ code: RelayErrorCode.LessonNotRunnable })
        await this.content.requireAccess({ learnerId: device.learnerId, phase: "apply", isPremium: undefined })
        const pack = await this.sources.archive(lessonId)
        if (pack === null) throw new RelayError({ code: RelayErrorCode.LessonNotRunnable })
        return pack
    }

    /**
     * Stores one upload of the device once per client event id and acknowledges it on the device's topic; a resend stores
     * nothing and is acknowledged again, so a CLI that lost the ack clears its queue.
     */
    async upload(device: DevicePrincipal, upload: RelayUpload): Promise<UploadReceipt> {
        if (!uploadValid(upload)) throw new RelayError({ code: RelayErrorCode.PayloadInvalid })
        const resultDetail = resultDetailOf(upload)
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
            resultDetail === null ? null : JSON.stringify(resultDetail),
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
