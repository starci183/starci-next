import { Injectable, Optional } from "@nestjs/common"
import type { KeyObject } from "node:crypto"
import type { EntityManager } from "typeorm"
import { InjectEntitlementService, type EntitlementService } from "@modules/domain/entitlement"
import { InjectClock, type Clock } from "@modules/platform/clock"
import { InjectPrimaryEntityManager, LIST_ROWS_MAX, type sql } from "@modules/platform/database"
import { InjectRealtimeHub, type RealtimeHub } from "@modules/platform/realtime"
import { RelayError, RelayErrorCode } from "./errors/relay.error"
import { InjectRelayOptions } from "./relay.decorators"
import type { RelayOptions } from "./relay.options"
import type { DevicePrincipal } from "./relay.contracts"
import { HarnessError, HarnessErrorCode, HarnessReadService } from "@modules/domain/harness"
import { milestoneIn, ProjectCheckSetService } from "@modules/domain/project"
import { LessonContentService, LessonSourceService, type LessonSourcePack } from "@modules/domain/lesson"
import { RelayLessonService, type LessonScenarioRunView } from "./relay-lesson.service"
import { isHarnessTask } from "./relay-harness.policy"
import {
    harnessBuildManifestOf,
    harnessDoctorManifestOf,
    harnessTargetOfTask,
    harnessTrialManifestOf,
} from "./relay-harness-manifest.policy"
import {
    LESSON_SOURCE_MAX_BYTES,
    lessonIdOfTask,
    lessonManifestOf,
    lessonSourcePathOf,
    tierBelow,
} from "./relay-lesson-manifest.policy"
import type {
    LearnerRunEvent,
    ManifestHarness,
    ManifestLesson,
    ManifestRequest,
    RelayUpload,
    ScenarioRunRequest,
    SignedManifest,
    UploadReceipt,
} from "./relay-feed.contracts"
import {
    PROJECT_CHECKS,
    manifestIdOf,
    projectRunOf,
    relayDeviceTopic,
    resultDetailOf,
    scenarioCheckOf,
    signManifest,
    signingKeyOf,
    uploadValid,
} from "./relay-feed.policy"
import { INSERT_EVENT, SELECT_LEARNER_RUN_EVENTS } from "./persistence/relay-events.sql"

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
        @InjectEntitlementService() private readonly entitlement: EntitlementService,
        private readonly checks: ProjectCheckSetService,
        @InjectRelayOptions() options: RelayOptions,
        @Optional() private readonly lessons?: RelayLessonService,
        @Optional() private readonly content?: LessonContentService,
        @Optional() private readonly sources?: LessonSourceService,
        @Optional() private readonly harness?: HarnessReadService,
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
        await this.requireSubscriberForProject(device.learnerId, taskId)
        const milestone =
            request?.milestone === undefined ? null : milestoneIn(await this.checks.current(), request.milestone)
        const run = milestone === null ? null : projectRunOf({ ...request, milestone })
        if (request?.milestone !== undefined && run === null)
            throw new RelayError({ code: RelayErrorCode.PayloadInvalid })
        const lesson = await this.lessonSection(device, taskId, request)
        const harness = await this.harnessSection(taskId)
        const issuedAt = this.clock.now().toISOString()
        const signed = signManifest(
            {
                manifestId: manifestIdOf(device.deviceId, taskId, issuedAt),
                taskId,
                learnerId: device.learnerId,
                deviceId: device.deviceId,
                issuedAt,
                checks: lesson === null && harness === null ? (run?.checks ?? PROJECT_CHECKS) : [],
                ...(run === null ? {} : { plan: run.plan }),
                ...(lesson === null ? {} : { lesson }),
                ...(harness === null ? {} : { harness }),
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
     * The signed harness section of a `harness:build:<id>` task, or null for any other task. /harness is free for everyone, so no
     * entitlement is asked; an unknown build or a tarball the CLI could not take is HARNESS_NOT_FOUND.
     */
    private async harnessSection(taskId: string): Promise<ManifestHarness | null> {
        const target = harnessTargetOfTask(taskId)
        if (target === null) return null
        if (this.harness === undefined) throw new HarnessError({ code: HarnessErrorCode.NotFound })
        const section = await this.harnessSectionOf(this.harness, target)
        if (section === null) throw new HarnessError({ code: HarnessErrorCode.NotFound })
        return section
    }

    private async harnessSectionOf(
        harness: HarnessReadService,
        target: NonNullable<ReturnType<typeof harnessTargetOfTask>>,
    ): Promise<ManifestHarness | null> {
        if (target.kind === "build") {
            const build = (await harness.storedBuilds()).find((each) => each.id === target.key)
            if (build === undefined) return null
            const pack = await harness.pack("build", target.key)
            return harnessBuildManifestOf(build, {
                sha256: pack.sha256,
                commit: pack.commit,
                size: pack.content.length,
            })
        }
        if (target.kind === "doctor") {
            const pack = await harness.pack("doctor-pack", target.key)
            return harnessDoctorManifestOf(target.key, {
                sha256: pack.sha256,
                commit: pack.commit,
                size: pack.content.length,
            })
        }
        const pack = await harness.pack("trap", target.key)
        return harnessTrialManifestOf(target.key, {
            sha256: pack.sha256,
            commit: pack.commit,
            size: pack.content.length,
        })
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
        // A challenge run is Tự áp dụng; any other lesson run (the scenarios and the lesson section) is Kịch bản.
        await this.content.requireAccess({
            learnerId: device.learnerId,
            phase: "apply",
            isPremium: undefined,
            part: request?.challenge === undefined ? "3-scenarios" : "4-apply",
        })
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
        await this.content.requireAccess({
            learnerId: device.learnerId,
            phase: "apply",
            isPremium: undefined,
            part: "2-source",
        })
        const pack = await this.sources.archive(lessonId)
        if (pack === null) throw new RelayError({ code: RelayErrorCode.LessonNotRunnable })
        return pack
    }

    /**
     * The newest relayed run of each scenario and challenge tier of a lesson, for the learner who asks. Scenario runs are Kịch bản
     * and challenge runs Tự áp dụng: a learner who may read neither part is refused (never an empty answer that hides the lock),
     * and one who may read only one part gets only that part's runs.
     */
    async lessonRuns(learnerId: string, lessonId: string): Promise<ReadonlyArray<LessonScenarioRunView>> {
        if (this.content === undefined || this.lessons === undefined)
            throw new RelayError({ code: RelayErrorCode.LessonNotRunnable })
        const [scenarios, challenges] = await Promise.all([
            this.content.mayReadPart(learnerId, "3-scenarios"),
            this.content.mayReadPart(learnerId, "4-apply"),
        ])
        if (!scenarios && !challenges)
            await this.content.requireAccess({ learnerId, phase: "apply", isPremium: undefined, part: "3-scenarios" })
        const runs = await this.lessons.runs(learnerId, lessonId)
        return runs.filter((run) => (run.challengeTier === null ? scenarios : challenges))
    }

    /**
     * Issues the signed manifest of one scenario run to the device and pushes it to the device's topic. The manifest carries the
     * one allowlisted `starci-next run` command; the CLI shows it and asks the learner before it runs anything.
     */
    async scenarioManifest(device: DevicePrincipal, request: ScenarioRunRequest): Promise<SignedManifest> {
        const check = scenarioCheckOf(request)
        if (check === null) throw new RelayError({ code: RelayErrorCode.PayloadInvalid })
        await this.content?.requireAccess({
            learnerId: device.learnerId,
            phase: "apply",
            isPremium: undefined,
            part: "3-scenarios",
        })
        const issuedAt = this.clock.now().toISOString()
        const signed = signManifest(
            {
                manifestId: manifestIdOf(device.deviceId, `lesson:${request.lessonId}:${check.command}`, issuedAt),
                taskId: `lesson:${request.lessonId}`,
                learnerId: device.learnerId,
                deviceId: device.deviceId,
                issuedAt,
                checks: [check],
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

    /** The learner's own stored results and logs of one task, newest first; another learner's events are never read. */
    async runEvents(learnerId: string, taskId: string): Promise<ReadonlyArray<LearnerRunEvent>> {
        const rows: Array<{
            run_id: string
            kind: "check.result" | "log"
            check_id: string
            passed: boolean | null
            exit_code: number | null
            commit_sha: string | null
            body: string | null
            created_at: Date
        }> = await this.entityManager.query(SELECT_LEARNER_RUN_EVENTS, [learnerId, taskId, LIST_ROWS_MAX])
        return rows.map((row) => ({
            runId: row.run_id,
            kind: row.kind,
            checkId: row.check_id,
            passed: row.passed,
            exitCode: row.exit_code,
            commit: row.commit_sha,
            text: row.kind === "log" ? row.body : null,
            at: row.created_at.toISOString(),
        }))
    }

    /**
     * Stores one upload of the device once per client event id and acknowledges it on the device's topic; a resend stores
     * nothing and is acknowledged again, so a CLI that lost the ack clears its queue.
     */
    async upload(device: DevicePrincipal, upload: RelayUpload): Promise<UploadReceipt> {
        if (!uploadValid(upload)) throw new RelayError({ code: RelayErrorCode.PayloadInvalid })
        await this.requireSubscriberForProject(device.learnerId, upload.taskId)
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

    /**
     * Projects are subscription-only: a manifest or an upload of any task that is not a lesson is a project run, and a learner without
     * Premium is refused before anything is signed, stored or pushed. A lesson task keeps its own access rules, and a harness task is free for everyone (owner 2026-11-17).
     */
    private async requireSubscriberForProject(learnerId: string, taskId: string): Promise<void> {
        if (lessonIdOfTask(taskId) !== null || isHarnessTask(taskId)) return
        if (!(await this.entitlement.isPremium(learnerId)))
            throw new RelayError({ code: RelayErrorCode.ProjectPremiumRequired })
    }

    /** Runs one write; a failed write answers the relay unavailable. */
    private async write(statement: SqlText, params: ReadonlyArray<unknown>): Promise<void> {
        await this.entityManager.query(statement, [...params]).catch((cause: unknown) => {
            throw new RelayError({ code: RelayErrorCode.Unavailable, cause })
        })
    }
}
