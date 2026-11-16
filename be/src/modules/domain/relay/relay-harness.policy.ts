import type { RelayUpload } from "./relay-feed.contracts"

/** The prefix of the task id of a harness build; the build id follows. */
export const HARNESS_BUILD_TASK = "harness:build:"

/** The task id of doctor results. */
export const HARNESS_DOCTOR_TASK = "harness:doctor"

/** The task id of trial results. */
export const HARNESS_TRIAL_TASK = "harness:trial"

const SLUG = /^[a-z0-9][a-z0-9-]{0,63}$/u
const TOOLS: ReadonlySet<string> = new Set(["claude", "codex"])
const VERDICTS: ReadonlySet<string> = new Set(["held", "breached", "incomplete"])
const DOCTOR_STATUSES: ReadonlySet<string> = new Set(["passed", "failed", "skipped", "invalid"])
const SHORTCUTS_MAX = 20
const REASON = /^[a-z0-9][a-z0-9._-]{0,63}$/u

/** Whether the upload carries any harness-only field. */
const hasHarnessFields = (upload: RelayUpload): boolean =>
    [
        upload.buildId,
        upload.stageId,
        upload.tool,
        upload.verdict,
        upload.testsGreen,
        upload.shortcuts,
        upload.status,
        upload.reason,
        upload.envPresent,
    ].some((value) => value !== undefined)

const ENV_NAME = /^[A-Z][A-Z0-9_]{0,63}$/u
const ENV_MAX = 16

const stageValid = (upload: RelayUpload): boolean =>
    (upload.envPresent ?? []).length <= ENV_MAX &&
    (upload.envPresent ?? []).every((name) => ENV_NAME.test(name)) &&
    upload.buildId !== undefined &&
    SLUG.test(upload.buildId) &&
    upload.stageId !== undefined &&
    SLUG.test(upload.stageId) &&
    upload.taskId === `${HARNESS_BUILD_TASK}${upload.buildId}` &&
    upload.checkId === upload.stageId &&
    upload.ref !== undefined &&
    SLUG.test(upload.ref)

const doctorValid = (upload: RelayUpload): boolean =>
    upload.tool !== undefined &&
    TOOLS.has(upload.tool) &&
    upload.taskId === HARNESS_DOCTOR_TASK &&
    upload.checkId !== undefined &&
    SLUG.test(upload.checkId) &&
    upload.ref === upload.tool &&
    (upload.status === undefined || DOCTOR_STATUSES.has(upload.status)) &&
    (upload.reason === undefined || REASON.test(upload.reason))

const trialValid = (upload: RelayUpload): boolean =>
    upload.tool !== undefined &&
    TOOLS.has(upload.tool) &&
    upload.taskId === HARNESS_TRIAL_TASK &&
    upload.checkId !== undefined &&
    SLUG.test(upload.checkId) &&
    upload.ref === upload.tool &&
    upload.verdict !== undefined &&
    VERDICTS.has(upload.verdict) &&
    upload.testsGreen !== undefined &&
    (upload.shortcuts ?? []).length <= SHORTCUTS_MAX &&
    (upload.shortcuts ?? []).every((shortcut) => REASON.test(shortcut.kind))

/**
 * True when the harness facts of a result are consistent with its slot: each harness slot needs its own fields and the task and
 * check ids they name (a stage result is `harness:build:<build>` with the stage as the check and the e2e id as the ref), and a
 * result of any other slot carries none of them.
 */
export const harnessFactsValid = (upload: RelayUpload): boolean => {
    switch (upload.slot) {
        case "harness-stage":
            return stageValid(upload)
        case "harness-doctor":
            return doctorValid(upload)
        case "harness-trial":
            return trialValid(upload)
        default:
            return !hasHarnessFields(upload)
    }
}

/** The harness facts of a result as stored in `detail`, empty for any other slot. */
export const harnessDetailOf = (upload: RelayUpload): Record<string, unknown> => ({
    ...(upload.buildId === undefined ? {} : { buildId: upload.buildId }),
    ...(upload.stageId === undefined ? {} : { stageId: upload.stageId }),
    ...(upload.envPresent === undefined ? {} : { envPresent: [...upload.envPresent] }),
    ...(upload.tool === undefined ? {} : { tool: upload.tool }),
    ...(upload.verdict === undefined ? {} : { verdict: upload.verdict }),
    ...(upload.testsGreen === undefined ? {} : { testsGreen: upload.testsGreen }),
    ...(upload.shortcuts === undefined
        ? {}
        : { shortcuts: upload.shortcuts.map((shortcut) => ({ kind: shortcut.kind, blocked: shortcut.blocked })) }),
    ...(upload.status === undefined ? {} : { status: upload.status }),
    ...(upload.reason === undefined ? {} : { reason: upload.reason }),
})
