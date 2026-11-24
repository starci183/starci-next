import { Injectable, Optional } from "@nestjs/common"
import type { EntityManager } from "typeorm"
import { InjectEntitlementService, type EntitlementService } from "@modules/domain/entitlement"
import { InjectClock, type Clock } from "@modules/platform/clock"
import { InjectPrimaryEntityManager } from "@modules/platform/database"
import { InjectRealtimeHub, type RealtimeHub } from "@modules/platform/realtime"
import { RelayError, RelayErrorCode } from "./errors/relay.error"
import type { DevicePrincipal, RelayDevice } from "./relay.contracts"
import type { RelayUpload, UploadReceipt } from "./relay-feed.contracts"
import { relayDeviceTopic, uploadValid } from "./relay-feed.policy"
import { RelayDeviceService } from "./relay-device.service"
import { RelayFeedService } from "./relay-feed.service"
import {
    LAB_BOOT_STAGES,
    type CourseLabBootView,
    type CourseLabLogView,
    type CourseLabRequested,
    type CourseLabSubmissionView,
    type CourseLabSubmitted,
    type CourseLabView,
    type LabAction,
    type LabGradeRejection,
    type LabSubmissionStatus,
    type RelayLabBootFacts,
    type RelayLabContract,
    type RelayLabFileFact,
    type RelayLabGradeFacts,
    type RelayLabTestFact,
} from "./relay-lab.contracts"
import {
    InjectRelayLabContract,
    RelayLabContractUnconfiguredAdapter,
    type RelayLabContractPort,
} from "./relay-lab-contract.port"
import {
    LAB_LOG_EVENTS_MAX,
    LAB_SUBMISSION_TIMEOUT_MS,
    chaosOnOf,
    gradeSectionOf,
    gradeVerdictOf,
    hiddenFilesValid,
    labIdValid,
    labIdsOfTask,
    labPhaseOf,
    labSectionOf,
    labTaskIdOf,
    logTailOf,
    nonceOf,
    seedOrderOf,
} from "./relay-lab.policy"
import {
    GRADE_SUBMISSION,
    INSERT_LAB_EVENT,
    INSERT_SUBMISSION,
    LOCK_LAB_SUBMISSIONS,
    LOCK_SUBMISSION,
    REJECT_OPEN_SUBMISSION,
    REJECT_RUNNING_SUBMISSION,
    SELECT_DEVICE_KEY,
    SELECT_LAB_LOGS,
    SELECT_LAB_SOLVED,
    SELECT_LAB_STATE,
    SELECT_LATEST_SUBMISSION,
    SELECT_OPEN_SUBMISSIONS,
    SET_SUBMISSION_RUNNING,
    UPSERT_LAB_BOOT,
    UPSERT_LAB_FILES,
    UPSERT_LAB_TESTS,
} from "./persistence/relay-lab.sql"

/** The Essentials part the lab belongs to: hands-on work beyond the free part, so it needs what that part needs (Premium by default). */
const LAB_ESSENTIAL_PART = "4-apply"

/** The most hints, design paragraphs and characters a submission carries. */
const HINTS_MAX = 1000
const DESIGN_PARAGRAPHS_MAX = 50
const DESIGN_PARAGRAPH_MAX = 4000
const TIME_SPENT_MAX_MS = 2_000_000_000

/** What the learner supplies with a submission. */
export interface CourseLabSubmission {
    /** The hints the learner opened. */
    readonly hintsOpened: number
    /** The time the learner spent, in milliseconds. */
    readonly timeSpentMs: number
    /** The design document, a list of paragraphs. */
    readonly designDoc: ReadonlyArray<string>
}

/** One lab state row as the read returns it. */
interface LabStateRow {
    boot: Record<string, CourseLabBootView>
    tests: { commit: string; tests: ReadonlyArray<RelayLabTestFact> } | null
    files: { commit: string; files: ReadonlyArray<RelayLabFileFact> } | null
    chaos_on: ReadonlyArray<string>
    last_synced_at: Date | null
}

/** One submission row as the read returns it. */
interface SubmissionRow {
    id: string
    status: LabSubmissionStatus
    passed: boolean
    reject_reason: LabGradeRejection | null
    commit_sha: string | null
    tests: ReadonlyArray<{ id: string; passed: boolean }> | null
    hints_opened: number
    time_spent_ms: number
    created_at: Date
    graded_at: Date | null
}

/** One submission row a grading result names. */
interface LockedSubmissionRow {
    id: string
    learner_id: string
    course_id: string
    lesson_id: string
    nonce: string
    status: string
}

@Injectable()
/**
 * The lab of a lesson on the learner's machine: the state it last synced, the doors that ask it to boot, test, switch chaos or grade, and the
 * upload kinds it answers with. Grading runs on the learner's machine against the hidden tests the relay sends for one run; the result is
 * accepted only with the device's Ed25519 signature over the submission's own nonce (practice level, never proof). No hidden file or
 * hidden test text is ever in a read.
 */
export class RelayLabService {
    private readonly contracts: RelayLabContractPort

    constructor(
        @InjectPrimaryEntityManager() private readonly entityManager: EntityManager,
        @InjectClock() private readonly clock: Clock,
        @InjectRealtimeHub() private readonly hub: RealtimeHub,
        @InjectEntitlementService() private readonly entitlement: EntitlementService,
        private readonly devices: RelayDeviceService,
        private readonly feed: RelayFeedService,
        @Optional() @InjectRelayLabContract() contracts?: RelayLabContractPort,
    ) {
        this.contracts = contracts ?? new RelayLabContractUnconfiguredAdapter()
    }

    /** The lab of one lesson for the learner: what their machine last synced, with the device state and the newest submission. */
    async view(learnerId: string, courseId: string, lessonId: string): Promise<CourseLabView> {
        const contract = await this.requireLab(learnerId, courseId, lessonId)
        const taskId = labTaskIdOf(courseId, lessonId)
        const [states, logRows, submissions, solved, devices] = await Promise.all([
            this.entityManager.query(SELECT_LAB_STATE, [learnerId, courseId, lessonId]),
            this.entityManager.query(SELECT_LAB_LOGS, [learnerId, taskId, LAB_LOG_EVENTS_MAX]),
            this.entityManager.query(SELECT_LATEST_SUBMISSION, [learnerId, courseId, lessonId]),
            this.entityManager.query(SELECT_LAB_SOLVED, [learnerId, courseId, lessonId]),
            this.devices.devices(learnerId),
        ])
        const state: LabStateRow | undefined = (states as Array<LabStateRow>)[0]
        const device = deviceStateOf(devices)
        const boot = LAB_BOOT_STAGES.flatMap((stage) => {
            const reported = state?.boot[stage]
            return reported === undefined ? [] : [reported]
        })
        const results = new Map((state?.tests?.tests ?? []).map((test) => [test.id, test]))
        const isSolved = (solved as Array<{ solved: boolean }>)[0]?.solved === true
        const submission = (submissions as Array<SubmissionRow>)[0]
        return {
            courseId,
            lessonId,
            device,
            phase: labPhaseOf(boot),
            boot,
            tests: contract.tests.map((test) => {
                const result = results.get(test.id)
                return {
                    id: test.id,
                    name: test.name,
                    file: test.file,
                    passed: result?.passed ?? null,
                    durationMs: result?.durationMs ?? null,
                    message: result === undefined || result.passed ? null : result.message,
                }
            }),
            files: (state?.files?.files ?? []).map((file) => ({
                path: file.path,
                text: file.text,
                sha256: file.sha256,
            })),
            logs: logsOf(contract, logRows as ReadonlyArray<LogRow>),
            chaosOn: [...(state?.chaos_on ?? [])],
            chaos: contract.chaos.map((each) => ({ id: each.id, label: each.label })),
            lastSyncedAt: state?.last_synced_at?.toISOString() ?? null,
            connectionLost: state !== undefined && device !== "online",
            solutionUnlocked: isSolved,
            solutionRepoUrl: isSolved ? contract.repo.url : null,
            latestSubmission: submission === undefined ? null : submissionViewOf(submission),
        }
    }

    /** Asks the learner's online device to boot the lab: clone, compose up, seed and the first run. */
    start(learnerId: string, courseId: string, lessonId: string): Promise<CourseLabRequested> {
        return this.request(learnerId, courseId, lessonId, "boot", undefined)
    }

    /** Asks the learner's online device to run the visible tests with the chaos switches that are on. */
    runTests(learnerId: string, courseId: string, lessonId: string): Promise<CourseLabRequested> {
        return this.request(learnerId, courseId, lessonId, "test", undefined)
    }

    /** Asks the learner's online device to turn exactly these chaos switches on and run the visible tests again. */
    setChaos(
        learnerId: string,
        courseId: string,
        lessonId: string,
        chaosIds: ReadonlyArray<string>,
    ): Promise<CourseLabRequested> {
        return this.request(learnerId, courseId, lessonId, "chaos", chaosIds)
    }

    /**
     * Creates a submission and asks the learner's online device to grade it on a clean checkout of its committed sha: the manifest
     * carries the hidden files and a random order of the hidden test ids, bound to a random nonce. The device must have registered its
     * signing key. A submission still running (under 15 minutes old) refuses another.
     */
    async submit(
        learnerId: string,
        courseId: string,
        lessonId: string,
        submission: CourseLabSubmission,
    ): Promise<CourseLabSubmitted> {
        if (!submissionValid(submission)) throw new RelayError({ code: RelayErrorCode.PayloadInvalid })
        const contract = await this.requireLab(learnerId, courseId, lessonId)
        const [hiddenIds, hidden] = await Promise.all([
            this.contracts.hiddenTestIdsOf(courseId, lessonId),
            this.contracts.hiddenOf(courseId, lessonId),
        ])
        if (hiddenIds.length === 0) throw new RelayError({ code: RelayErrorCode.LabNotFound })
        if (!hiddenFilesValid(hidden)) throw new RelayError({ code: RelayErrorCode.Unavailable })
        const device = await this.onlineDevice(learnerId)
        const key: Array<{ public_key: string | null }> = await this.entityManager.query(SELECT_DEVICE_KEY, [device.id])
        if ((key[0]?.public_key ?? null) === null) throw new RelayError({ code: RelayErrorCode.DeviceKeyMissing })
        const nonce = nonceOf()
        const seedOrder = seedOrderOf(hiddenIds)
        const now = this.clock.now()
        const submissionId = await this.entityManager.transaction(async (manager): Promise<string> => {
            await manager.query(LOCK_LAB_SUBMISSIONS, [learnerId, courseId, lessonId])
            const open: Array<{ id: string; created_at: Date }> = await manager.query(SELECT_OPEN_SUBMISSIONS, [
                learnerId,
                courseId,
                lessonId,
            ])
            if (open.some((row) => now.getTime() - row.created_at.getTime() < LAB_SUBMISSION_TIMEOUT_MS))
                throw new RelayError({ code: RelayErrorCode.LabSubmissionRunning })
            for (const row of open) await manager.query(REJECT_OPEN_SUBMISSION, [row.id, "timed-out", now])
            const created: Array<{ id: string }> = await manager.query(INSERT_SUBMISSION, [
                learnerId,
                courseId,
                lessonId,
                nonce,
                JSON.stringify(seedOrder),
                submission.hintsOpened,
                submission.timeSpentMs,
                JSON.stringify(submission.designDoc),
                device.id,
                now,
            ])
            const row = created[0]
            if (!row) throw new RelayError({ code: RelayErrorCode.Unavailable })
            await manager.query(SET_SUBMISSION_RUNNING, [row.id])
            return row.id
        })
        const state = await this.stateOf(learnerId, courseId, lessonId)
        const grade = gradeSectionOf({
            submissionId,
            nonce,
            seedOrder,
            commit: state?.files?.commit ?? state?.tests?.commit ?? null,
            hidden,
        })
        const lab = labSectionOf({ courseId, lessonId }, contract, "grade", state?.chaos_on ?? [], grade)
        try {
            const manifest = await this.feed.labManifest({ learnerId, deviceId: device.id }, lab)
            return { submissionId, device: device.name, action: "grade", manifestId: manifest.body.manifestId }
        } catch (cause) {
            await this.entityManager.query(REJECT_RUNNING_SUBMISSION, [submissionId, "push-failed", this.clock.now()])
            throw cause
        }
    }

    /**
     * Stores one lab upload of the device (`lab.boot`, `lab.tests`, `lab.files` or `lab.grade`) once per client event id, applies it to the
     * lab state and acknowledges it on the device's topic; a resend changes nothing and is acknowledged again. Only the files the lab names
     * are kept, only the visible tests of the contract are recorded, and a grading result is accepted only as `gradeVerdictOf` says.
     */
    async upload(device: DevicePrincipal, upload: RelayUpload): Promise<UploadReceipt> {
        const ids = labIdsOfTask(upload.taskId)
        if (!uploadValid(upload) || ids === null) throw new RelayError({ code: RelayErrorCode.PayloadInvalid })
        const contract = await this.contracts.contractOf(ids.courseId, ids.lessonId)
        if (contract === null) throw new RelayError({ code: RelayErrorCode.LabNotFound })
        if (upload.kind === "lab.files" && !filesAllowed(upload, contract))
            throw new RelayError({ code: RelayErrorCode.PayloadInvalid })
        const hiddenIds =
            upload.kind === "lab.grade" ? await this.contracts.hiddenTestIdsOf(ids.courseId, ids.lessonId) : []
        const deviceKey: Array<{ public_key: string | null }> =
            upload.kind === "lab.grade" ? await this.entityManager.query(SELECT_DEVICE_KEY, [device.deviceId]) : []
        const now = this.clock.now()
        await this.entityManager.transaction(async (manager): Promise<void> => {
            const stored: Array<{ event_id: string }> = await manager.query(INSERT_LAB_EVENT, [
                device.deviceId,
                upload.eventId,
                now,
            ])
            if (!stored[0]) return
            const base = [device.learnerId, ids.courseId, ids.lessonId, device.deviceId] as const
            if (upload.kind === "lab.boot" && upload.boot !== undefined)
                await manager.query(UPSERT_LAB_BOOT, [
                    ...base,
                    JSON.stringify({ [upload.boot.stage]: bootViewOf(upload.boot, now) }),
                    now,
                    upload.boot.stage === "machine" && upload.boot.status === "running",
                ])
            if (upload.kind === "lab.tests" && upload.labTests !== undefined) {
                const known = new Set(contract.tests.map((test) => test.id))
                const chaos = new Set(contract.chaos.map((each) => each.id))
                await manager.query(UPSERT_LAB_TESTS, [
                    ...base,
                    JSON.stringify({
                        commit: upload.labTests.commit,
                        tests: upload.labTests.tests.filter((test) => known.has(test.id)),
                    }),
                    JSON.stringify(upload.labTests.chaosOn.filter((id) => chaos.has(id))),
                    now,
                ])
            }
            if (upload.kind === "lab.files" && upload.labFiles !== undefined)
                await manager.query(UPSERT_LAB_FILES, [
                    ...base,
                    JSON.stringify({ commit: upload.labFiles.commit, files: upload.labFiles.files }),
                    now,
                ])
            if (upload.kind === "lab.grade" && upload.grade !== undefined)
                await this.applyGrade(
                    manager,
                    device,
                    upload.grade,
                    ids,
                    hiddenIds,
                    deviceKey[0]?.public_key ?? null,
                    now,
                )
        })
        await this.hub.publish(relayDeviceTopic(device.learnerId, device.deviceId), {
            id: `ack:${upload.eventId}`,
            type: "ack",
            eventId: upload.eventId,
        })
        return { eventId: upload.eventId, accepted: true }
    }

    /** Applies a grading result to its submission: graded when the verdict accepts it, rejected with its reason otherwise. */
    private async applyGrade(
        manager: EntityManager,
        device: DevicePrincipal,
        facts: RelayLabGradeFacts,
        ids: { readonly courseId: string; readonly lessonId: string },
        hiddenIds: ReadonlyArray<string>,
        deviceKey: string | null,
        now: Date,
    ): Promise<void> {
        const rows: Array<LockedSubmissionRow> = await manager.query(LOCK_SUBMISSION, [facts.submissionId])
        const submission = rows[0]
        if (!submission || submission.course_id !== ids.courseId || submission.lesson_id !== ids.lessonId)
            throw new RelayError({ code: RelayErrorCode.GradeRejected })
        const verdict = gradeVerdictOf({
            facts,
            submission: { learnerId: submission.learner_id, nonce: submission.nonce, status: submission.status },
            deviceLearnerId: device.learnerId,
            deviceKey,
            hiddenIds,
        })
        if (verdict.kind === "foreign") throw new RelayError({ code: RelayErrorCode.GradeRejected })
        if (verdict.kind === "rejected") {
            if (verdict.reason !== "not-running")
                await manager.query(REJECT_RUNNING_SUBMISSION, [submission.id, verdict.reason, now])
            return
        }
        await manager.query(GRADE_SUBMISSION, [
            submission.id,
            facts.commit,
            JSON.stringify(
                facts.tests.map((test) => ({ id: test.id, passed: test.passed, durationMs: test.durationMs })),
            ),
            verdict.passed,
            now,
        ])
    }

    /** Signs and pushes the manifest of one action to the learner's online device. */
    private async request(
        learnerId: string,
        courseId: string,
        lessonId: string,
        action: LabAction,
        chaosIds: ReadonlyArray<string> | undefined,
    ): Promise<CourseLabRequested> {
        const contract = await this.requireLab(learnerId, courseId, lessonId)
        const chaosOn =
            chaosIds === undefined
                ? ((await this.stateOf(learnerId, courseId, lessonId))?.chaos_on ?? [])
                : chaosOnOf(contract, chaosIds)
        if (chaosOn === null) throw new RelayError({ code: RelayErrorCode.PayloadInvalid })
        const device = await this.onlineDevice(learnerId)
        const lab = labSectionOf({ courseId, lessonId }, contract, action, chaosOn)
        const manifest = await this.feed.labManifest({ learnerId, deviceId: device.id }, lab)
        return { device: device.name, action, manifestId: manifest.body.manifestId }
    }

    /** The lab contract of the lesson, for a learner who may read the lab; the ids are slugs, the part follows the entitlement setting. */
    private async requireLab(learnerId: string, courseId: string, lessonId: string): Promise<RelayLabContract> {
        if (!labIdValid(courseId) || !labIdValid(lessonId)) throw new RelayError({ code: RelayErrorCode.LabNotFound })
        if (!(await this.entitlement.mayReadEssentialPart(learnerId, LAB_ESSENTIAL_PART)))
            throw new RelayError({ code: RelayErrorCode.LabPremiumRequired })
        const contract = await this.contracts.contractOf(courseId, lessonId)
        if (contract === null) throw new RelayError({ code: RelayErrorCode.LabNotFound })
        return contract
    }

    /** The learner's newest online device; none online is RELAY_DEVICE_OFFLINE and nothing is signed or pushed. */
    private async onlineDevice(learnerId: string): Promise<RelayDevice> {
        const device = (await this.devices.devices(learnerId)).find((each) => each.online)
        if (device === undefined) throw new RelayError({ code: RelayErrorCode.DeviceOffline })
        return device
    }

    private async stateOf(learnerId: string, courseId: string, lessonId: string): Promise<LabStateRow | undefined> {
        const rows: Array<LabStateRow> = await this.entityManager.query(SELECT_LAB_STATE, [
            learnerId,
            courseId,
            lessonId,
        ])
        return rows[0]
    }
}

/** One log chunk row. */
interface LogRow {
    check_id: string
    body: string
}

/** The device state of the lab: none paired, paired but none online, or one online. */
const deviceStateOf = (devices: ReadonlyArray<RelayDevice>): "none" | "offline" | "online" => {
    if (devices.length === 0) return "none"
    return devices.some((device) => device.online) ? "online" : "offline"
}

/** The log tails of the contract's services: the chunks come newest first, so each service's are reversed into reading order. */
const logsOf = (contract: RelayLabContract, rows: ReadonlyArray<LogRow>): ReadonlyArray<CourseLabLogView> =>
    contract.services.map((service) => ({
        service,
        lines: logTailOf(
            rows
                .filter((row) => row.check_id === service)
                .map((row) => row.body)
                .reverse(),
        ),
    }))

/** One boot stage as stored: the facts with the instant they were reported. */
const bootViewOf = (boot: RelayLabBootFacts, now: Date): CourseLabBootView => ({
    stage: boot.stage,
    status: boot.status,
    detail: boot.detail,
    durationMs: boot.durationMs,
    at: now.toISOString(),
})

/** The newest submission as the web reads it: the verdict of each hidden test by id only, nothing the test says. */
const submissionViewOf = (row: SubmissionRow): CourseLabSubmissionView => ({
    id: row.id,
    status: row.status,
    passed: row.passed,
    rejectReason: row.reject_reason,
    commit: row.commit_sha,
    tests: (row.tests ?? []).map((test) => ({ id: test.id, passed: test.passed })),
    hintsOpened: row.hints_opened,
    timeSpentMs: row.time_spent_ms,
    createdAt: row.created_at.toISOString(),
    gradedAt: row.graded_at?.toISOString() ?? null,
})

/** True when every file of a `lab.files` upload is one the lab names. */
const filesAllowed = (upload: RelayUpload, contract: RelayLabContract): boolean =>
    (upload.labFiles?.files ?? []).every((file) => contract.files.includes(file.path))

/** True when the learner's part of a submission is within its bounds. */
const submissionValid = (submission: CourseLabSubmission): boolean =>
    Number.isSafeInteger(submission.hintsOpened) &&
    submission.hintsOpened >= 0 &&
    submission.hintsOpened <= HINTS_MAX &&
    Number.isSafeInteger(submission.timeSpentMs) &&
    submission.timeSpentMs >= 0 &&
    submission.timeSpentMs <= TIME_SPENT_MAX_MS &&
    submission.designDoc.length <= DESIGN_PARAGRAPHS_MAX &&
    submission.designDoc.every((paragraph) => paragraph.length <= DESIGN_PARAGRAPH_MAX)
