import { createHash, createPublicKey, randomBytes, randomInt, verify } from "node:crypto"
import type { RelayUpload } from "./relay-feed.contracts"
import {
    LAB_BOOT_STAGES,
    type CourseLabBootView,
    type LabAction,
    type LabGradeRejection,
    type ManifestLab,
    type ManifestLabGrade,
    type RelayLabContract,
    type RelayLabGradeFacts,
    type RelayLabHiddenFile,
} from "./relay-lab.contracts"

/** The prefix of the task id of a lab: `course:<courseId>/<lessonId>`. */
export const LAB_TASK_PREFIX = "course:"

/** The longest text of one mirrored file the relay keeps, in bytes (64 KiB); a larger file arrives with no text. */
export const LAB_FILE_TEXT_MAX_BYTES = 65_536

/** The most log lines the web reads per service. */
export const LAB_LOG_TAIL_LINES = 200

/** How many log events the relay reads of one lab to build the tails. */
export const LAB_LOG_EVENTS_MAX = 400

/** How long a submission may stay running before a new one replaces it, in milliseconds (15 minutes). */
export const LAB_SUBMISSION_TIMEOUT_MS = 900_000

const SLUG = /^[a-z0-9][a-z0-9-]{0,63}$/u
const SAFE_NAME = /^[A-Za-z0-9._:-]{1,100}$/u
const HEX_40 = /^[0-9a-f]{40}$/u
const HEX_64 = /^[0-9a-f]{64}$/u
const DETAIL_MAX = 300
const MESSAGE_MAX = 1000
const TESTS_MAX = 200
const FILES_MAX = 40
const CHAOS_MAX = 20
const PATH_MAX = 300
const SIGNATURE_MAX = 200
const HIDDEN_FILES_MAX_BYTES = 2_000_000

/** The task id of a lab: `course:<courseId>/<lessonId>`. */
export const labTaskIdOf = (courseId: string, lessonId: string): string => `${LAB_TASK_PREFIX}${courseId}/${lessonId}`

/** The course and lesson ids a `course:<courseId>/<lessonId>` task names, or null for any other task. */
export const labIdsOfTask = (taskId: string): { readonly courseId: string; readonly lessonId: string } | null => {
    if (!taskId.startsWith(LAB_TASK_PREFIX)) return null
    const [courseId, lessonId, ...rest] = taskId.slice(LAB_TASK_PREFIX.length).split("/")
    if (courseId === undefined || lessonId === undefined || rest.length > 0) return null
    return SLUG.test(courseId) && SLUG.test(lessonId) ? { courseId, lessonId } : null
}

/** True when a course or lesson id could be one (a lowercase slug). */
export const labIdValid = (id: string): boolean => SLUG.test(id)

/** The compose project name of a lab, `starci-<course>-<lesson>`. */
export const labProjectOf = (courseId: string, lessonId: string): string => `starci-${courseId}-${lessonId}`

/** The lab section of a manifest: the contract with the action, the chaos that is on and, for a grading, its section. */
export const labSectionOf = (
    ids: { readonly courseId: string; readonly lessonId: string },
    contract: RelayLabContract,
    action: LabAction,
    chaosOn: ReadonlyArray<string>,
    grade?: ManifestLabGrade,
): ManifestLab => ({
    courseId: ids.courseId,
    lessonId: ids.lessonId,
    repo: { url: contract.repo.url, branch: contract.repo.branch, commit: contract.repo.commit },
    compose: contract.compose,
    project: labProjectOf(ids.courseId, ids.lessonId),
    services: [...contract.services],
    seed: { command: contract.seed.command, timeoutMs: contract.seed.timeoutMs },
    test: { command: contract.test.command, report: contract.test.report, timeoutMs: contract.test.timeoutMs },
    files: [...contract.files],
    chaos: contract.chaos.map((each) => ({ id: each.id, env: each.env, value: each.value })),
    chaosOn: [...chaosOn],
    action,
    ...(grade === undefined ? {} : { grade }),
})

/** The chaos ids a request names, de-duplicated in the contract's order; null when one names no switch of the lab. */
export const chaosOnOf = (
    contract: RelayLabContract,
    requested: ReadonlyArray<string>,
): ReadonlyArray<string> | null => {
    const known = new Set(contract.chaos.map((each) => each.id))
    if (!requested.every((id) => known.has(id))) return null
    const wanted = new Set(requested)
    return contract.chaos.map((each) => each.id).filter((id) => wanted.has(id))
}

/** The grading section of a manifest: the hidden files as base64 and the random order, bound to the nonce. */
export const gradeSectionOf = (params: {
    readonly submissionId: string
    readonly nonce: string
    readonly seedOrder: ReadonlyArray<string>
    readonly commit: string | null
    readonly hidden: ReadonlyArray<RelayLabHiddenFile>
}): ManifestLabGrade => ({
    submissionId: params.submissionId,
    nonce: params.nonce,
    seedOrder: [...params.seedOrder],
    commit: params.commit,
    files: params.hidden.map((file) => ({
        path: file.path,
        sha256: file.sha256,
        content: Buffer.from(file.text, "utf8").toString("base64"),
    })),
})

/** True when the hidden files are sound: relative paths, hashes that match their text, and a size the manifest can carry. */
export const hiddenFilesValid = (hidden: ReadonlyArray<RelayLabHiddenFile>): boolean =>
    hidden.reduce((sum, file) => sum + Buffer.byteLength(file.text, "utf8"), 0) <= HIDDEN_FILES_MAX_BYTES &&
    hidden.every(
        (file) =>
            file.path.length <= PATH_MAX &&
            !file.path.startsWith("/") &&
            !file.path.split("/").includes("..") &&
            file.sha256 === createHash("sha256").update(file.text, "utf8").digest("hex"),
    )

/** A random permutation of the hidden test ids (Fisher-Yates over a CSPRNG), so the run order is not guessable. */
export const seedOrderOf = (ids: ReadonlyArray<string>): Array<string> => {
    const order = [...ids]
    for (let index = order.length - 1; index > 0; index -= 1) {
        const other = randomInt(index + 1)
        const held = order[index]
        const swapped = order[other]
        if (held === undefined || swapped === undefined) continue
        order[index] = swapped
        order[other] = held
    }
    return order
}

/** 256 unpredictable bits as 64 lowercase hex characters: the nonce of one grading. */
export const nonceOf = (): string => randomBytes(32).toString("hex")

/** Six random digits, the pairing code the web issues. */
export const pairCodeOf = (): string => String(randomInt(1_000_000)).padStart(6, "0")

/** The six digits of a typed pairing code (spaces and a dash dropped), or null when it cannot be one. */
export const normalizedPairCode = (typed: string): string | null => {
    const compact = typed.replaceAll(/[\s-]/g, "")
    return /^\d{6}$/u.test(compact) ? compact : null
}

/** The one-way digest a pairing code is stored by. */
export const pairCodeDigestOf = (code: string): string =>
    createHash("sha256").update(`relay-pair:${code}`).digest("hex")

/** True when a base64 text is a SPKI Ed25519 public key. */
export const deviceKeyValid = (publicKey: string): boolean => {
    if (!/^[A-Za-z0-9+/]{20,120}={0,2}$/u.test(publicKey)) return false
    try {
        return (
            createPublicKey({ key: Buffer.from(publicKey, "base64"), format: "der", type: "spki" })
                .asymmetricKeyType === "ed25519"
        )
    } catch {
        return false
    }
}

/** Orders two strings by code unit, the order the canonical text sorts keys in. */
const byCodeUnit = (left: string, right: string): number => {
    if (left === right) return 0
    return left < right ? -1 : 1
}

/** The canonical JSON of a value: object keys sorted, no whitespace; the text a grading result is signed over. */
export const canonicalJson = (value: unknown): string => {
    if (Array.isArray(value)) return `[${value.map((item) => canonicalJson(item)).join(",")}]`
    if (value !== null && typeof value === "object") {
        const entries = Object.entries(value as Record<string, unknown>)
            .filter(([, member]) => member !== undefined)
            .sort(([left], [right]) => byCodeUnit(left, right))
        return `{${entries.map(([key, member]) => `${JSON.stringify(key)}:${canonicalJson(member)}`).join(",")}}`
    }
    return JSON.stringify(value)
}

/** The exact text a device signs for a grading result: the canonical JSON of `{submissionId, nonce, commit, tests}`. */
export const gradePayloadOf = (facts: RelayLabGradeFacts): string =>
    canonicalJson({
        submissionId: facts.submissionId,
        nonce: facts.nonce,
        commit: facts.commit,
        tests: facts.tests.map((test) => ({
            id: test.id,
            passed: test.passed,
            durationMs: test.durationMs,
            message: test.message,
        })),
    })

/** True when the signature is the device key's Ed25519 signature of the result's canonical text. */
export const gradeSignatureValid = (publicKey: string, facts: RelayLabGradeFacts): boolean => {
    try {
        const key = createPublicKey({ key: Buffer.from(publicKey, "base64"), format: "der", type: "spki" })
        return verify(null, Buffer.from(gradePayloadOf(facts), "utf8"), key, Buffer.from(facts.signature, "base64"))
    } catch {
        return false
    }
}

/** What a grading result is checked against. */
export interface GradeCheckFacts {
    /** The uploaded result. */
    readonly facts: RelayLabGradeFacts
    /** The submission the result names. */
    readonly submission: { readonly learnerId: string; readonly nonce: string; readonly status: string }
    /** The learner the uploading device belongs to. */
    readonly deviceLearnerId: string
    /** The device's registered public key, or null. */
    readonly deviceKey: string | null
    /** The hidden test ids of the lab. */
    readonly hiddenIds: ReadonlyArray<string>
}

/** The verdict of a grading result: accepted, refused as another learner's, or rejected with its stable reason. */
export type GradeVerdict =
    | { readonly kind: "accepted"; readonly passed: boolean }
    | { readonly kind: "foreign" }
    | { readonly kind: "rejected"; readonly reason: LabGradeRejection }

/** True when the tests name every hidden id exactly once and nothing else. */
const testsMatchHidden = (facts: RelayLabGradeFacts, hiddenIds: ReadonlyArray<string>): boolean => {
    const named = facts.tests.map((test) => test.id)
    return (
        hiddenIds.length > 0 &&
        named.length === hiddenIds.length &&
        new Set(named).size === named.length &&
        hiddenIds.every((id) => named.includes(id))
    )
}

/**
 * Checks a grading result in a fixed order, so a rejection always carries the same reason: the submission is the uploading
 * learner's (else it is refused untouched), it is still running, the nonce is its own, the commit is 40 hex, the device has a key
 * and signed the canonical text, and every hidden test id appears exactly once. Passing is every test passed.
 */
export const gradeVerdictOf = (check: GradeCheckFacts): GradeVerdict => {
    const { facts, submission } = check
    if (submission.learnerId !== check.deviceLearnerId) return { kind: "foreign" }
    if (submission.status !== "running") return { kind: "rejected", reason: "not-running" }
    if (facts.nonce !== submission.nonce) return { kind: "rejected", reason: "nonce-mismatch" }
    if (!HEX_40.test(facts.commit)) return { kind: "rejected", reason: "commit-invalid" }
    if (check.deviceKey === null) return { kind: "rejected", reason: "device-key-missing" }
    if (!gradeSignatureValid(check.deviceKey, facts)) return { kind: "rejected", reason: "signature-invalid" }
    if (!testsMatchHidden(facts, check.hiddenIds)) return { kind: "rejected", reason: "tests-mismatch" }
    return { kind: "accepted", passed: facts.tests.every((test) => test.passed) }
}

/** Where the lab stands on the web: nothing reported, stages reported, or the first run done. */
export const labPhaseOf = (
    boot: ReadonlyArray<Pick<CourseLabBootView, "stage" | "status">>,
): "setup" | "booting" | "ready" => {
    if (boot.length === 0) return "setup"
    return boot.some((each) => each.stage === "first-run" && each.status === "done") ? "ready" : "booting"
}

/** The last `max` lines of a service's log chunks, which come oldest first. */
export const logTailOf = (chunks: ReadonlyArray<string>, max: number = LAB_LOG_TAIL_LINES): ReadonlyArray<string> =>
    chunks
        .join("\n")
        .split(/\r?\n/u)
        .filter((line) => line !== "")
        .slice(-max)

/** True when a text is at most 64 KiB in UTF-8 bytes. */
export const fileTextFits = (text: string): boolean => Buffer.byteLength(text, "utf8") <= LAB_FILE_TEXT_MAX_BYTES

/** True when a lab upload's facts are present for its kind and bounded. */
const labFactsValid = (upload: RelayUpload): boolean => {
    switch (upload.kind) {
        case "lab.boot": {
            const boot = upload.boot
            return (
                boot !== undefined &&
                (LAB_BOOT_STAGES as ReadonlyArray<string>).includes(boot.stage) &&
                ["running", "done", "failed"].includes(boot.status) &&
                boot.detail.length <= DETAIL_MAX &&
                Number.isSafeInteger(boot.durationMs) &&
                boot.durationMs >= 0 &&
                boot.durationMs <= 86_400_000
            )
        }
        case "lab.tests": {
            const run = upload.labTests
            return (
                run !== undefined &&
                HEX_40.test(run.commit) &&
                run.chaosOn.length <= CHAOS_MAX &&
                run.chaosOn.every((id) => SAFE_NAME.test(id)) &&
                run.tests.length <= TESTS_MAX &&
                run.tests.every(
                    (test) =>
                        SAFE_NAME.test(test.id) &&
                        test.name.length <= PATH_MAX &&
                        test.message.length <= MESSAGE_MAX &&
                        Number.isSafeInteger(test.durationMs) &&
                        test.durationMs >= 0 &&
                        test.durationMs <= 86_400_000,
                )
            )
        }
        case "lab.files": {
            const synced = upload.labFiles
            return (
                synced !== undefined &&
                HEX_40.test(synced.commit) &&
                synced.files.length <= FILES_MAX &&
                synced.files.every(
                    (file) =>
                        file.path.length <= PATH_MAX &&
                        file.path !== "" &&
                        !file.path.startsWith("/") &&
                        !file.path.split("/").includes("..") &&
                        HEX_64.test(file.sha256) &&
                        (file.text === null || fileTextFits(file.text)),
                )
            )
        }
        case "lab.grade": {
            const grade = upload.grade
            return (
                grade !== undefined &&
                /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(
                    grade.submissionId,
                ) &&
                HEX_64.test(grade.nonce) &&
                grade.signature.length > 0 &&
                grade.signature.length <= SIGNATURE_MAX &&
                grade.tests.length <= TESTS_MAX &&
                grade.tests.every(
                    (test) =>
                        SAFE_NAME.test(test.id) &&
                        test.message.length <= MESSAGE_MAX &&
                        Number.isSafeInteger(test.durationMs) &&
                        test.durationMs >= 0 &&
                        test.durationMs <= 86_400_000,
                )
            )
        }
        default:
            return false
    }
}

/** True for the four upload kinds that change a lab's state instead of adding a row to the event log. */
export const isLabUploadKind = (kind: RelayUpload["kind"]): boolean =>
    kind === "lab.boot" || kind === "lab.tests" || kind === "lab.files" || kind === "lab.grade"

/**
 * True when a lab upload names a lab task and carries exactly the facts of its kind within their bounds. The base facts
 * (event id, task, run) are checked by the feed's `uploadValid`, which calls this for the four lab kinds.
 */
export const labUploadValid = (upload: RelayUpload): boolean =>
    labIdsOfTask(upload.taskId) !== null && labFactsValid(upload)
