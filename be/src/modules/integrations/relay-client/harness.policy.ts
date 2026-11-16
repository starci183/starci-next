import type {
    HarnessBuildSection,
    HarnessDoctorSection,
    HarnessSource,
    HarnessTrialSection,
    HarnessKey,
    HarnessPlan,
    HarnessSection,
    HarnessStageDef,
    HarnessState,
} from "./harness.contracts"
import { isRecord } from "./json.mapper"
import { isSafePath } from "./lesson.policy"

const ID = /^[a-z0-9][a-z0-9-]{0,63}$/u
const ENV_NAME = /^[A-Z][A-Z0-9_]*$/u
const COMMIT = /^[0-9a-f]{40}$/u
const SOURCE_URL = /^(?:https:\/\/[^\s"'<>\\]+|\/[^\s"'<>\\]*)$/u
const SHA256 = /^[0-9a-f]{64}$/u
const MAX_STAGES = 40
const MAX_E2E = 60

/** True when a build, stage or e2e id is well formed. */
export const isHarnessId = (value: string): boolean => ID.test(value)

/** A command is one line of printable text; the CLI runs it only because StarCi signed it. */
const isCommand = (value: unknown): value is string =>
    typeof value === "string" && value.trim() !== "" && value.length <= 300 && !/[\r\n\0]/u.test(value)

const keyOf = (value: unknown): HarnessKey | null => {
    if (!isRecord(value) || typeof value.id !== "string" || !ID.test(value.id)) return null
    const { anyOf } = value
    if (!Array.isArray(anyOf) || anyOf.length === 0 || anyOf.length > 8) return null
    return anyOf.every((name) => typeof name === "string" && ENV_NAME.test(name))
        ? { id: value.id, anyOf: anyOf.map(String) }
        : null
}

const stageOf = (value: unknown): HarnessStageDef | null => {
    if (!isRecord(value) || typeof value.id !== "string" || !ID.test(value.id)) return null
    const { e2e } = value
    if (!Array.isArray(e2e) || e2e.length === 0 || e2e.length > MAX_E2E) return null
    return e2e.every((id) => typeof id === "string" && ID.test(id)) && new Set(e2e).size === e2e.length
        ? { id: value.id, e2e: e2e.map(String) }
        : null
}

/** The plan fields shared by the manifest section and the state file, or null when any is malformed. */
const planOf = (value: Record<string, unknown>): HarnessPlan | null => {
    const { buildId, dir, install, e2e, report } = value
    if (typeof buildId !== "string" || !ID.test(buildId)) return null
    if (!isSafePath(dir) || !isSafePath(report) || !isCommand(install) || !isCommand(e2e)) return null
    const rawKeys: unknown = value.keys === undefined ? [] : value.keys
    const rawStages: unknown = value.stages
    if (!Array.isArray(rawKeys) || !Array.isArray(rawStages)) return null
    if (rawStages.length === 0 || rawStages.length > MAX_STAGES) return null
    const keys = rawKeys.map((key) => keyOf(key))
    const stages = rawStages.map((stage) => stageOf(stage))
    if (keys.includes(null) || stages.includes(null)) return null
    const checked = stages.filter((stage) => stage !== null)
    if (new Set(checked.map((stage) => stage.id)).size !== checked.length) return null
    return { buildId, dir, install, e2e, report, keys: keys.filter((key) => key !== null), stages: checked }
}

const sourceOf = (value: unknown): HarnessSource | null => {
    if (!isRecord(value)) return null
    const { url, sha256, commit } = value
    if (typeof url !== "string" || !SOURCE_URL.test(url) || url.includes("@")) return null
    if (typeof sha256 !== "string" || !SHA256.test(sha256)) return null
    if (typeof commit !== "string" || !COMMIT.test(commit)) return null
    return { url, sha256, commit }
}

const doctorOf = (value: Record<string, unknown>): HarnessDoctorSection | null => {
    const source = sourceOf(value.source)
    const { tool } = value
    return source !== null && (tool === "claude" || tool === "codex") ? { kind: "doctor", tool, source } : null
}

const trialOf = (value: Record<string, unknown>): HarnessTrialSection | null => {
    const source = sourceOf(value.source)
    const { trap } = value
    return source !== null && typeof trap === "string" && ID.test(trap) ? { kind: "trial", trap, source } : null
}

/**
 * The `harness` section of a payload: undefined when absent, null when present but malformed. `build` carries the plan of a build,
 * `doctor` the tool and the probes tarball, `trial` the trap id and the trap tarball; any other kind is read as `other`, so a command
 * refuses it by name instead of the whole manifest being rejected.
 */
export const harnessOf = (value: unknown): HarnessSection | null | undefined => {
    if (value === undefined) return undefined
    if (!isRecord(value) || typeof value.kind !== "string") return null
    if (value.kind === "doctor") return doctorOf(value)
    if (value.kind === "trial") return trialOf(value)
    if (value.kind !== "build") return { kind: "other", name: value.kind }
    const source = sourceOf(value.source)
    const plan = source === null ? null : planOf(value)
    if (source === null || plan === null) return null
    const section: HarnessBuildSection = { kind: "build", ...plan, source }
    return section
}

/** The state file of a pulled build, or null when it is not one. */
export const harnessStateOf = (value: unknown): HarnessState | null => {
    if (!isRecord(value)) return null
    const plan = planOf(value)
    const { commit, sha256 } = value
    if (plan === null || typeof commit !== "string" || !COMMIT.test(commit)) return null
    return typeof sha256 === "string" && SHA256.test(sha256) ? { ...plan, commit, sha256 } : null
}

/** The stages a `--stage` value names (a 1-based number or an id), with their numbers; every stage when none is asked; null when it names none. */
export const stagesAsked = (
    plan: HarnessPlan,
    asked: string | undefined,
): ReadonlyArray<{ readonly n: number; readonly stage: HarnessStageDef }> | null => {
    const all = plan.stages.map((stage, index) => ({ n: index + 1, stage }))
    if (asked === undefined) return all
    const found = all.filter((item) => String(item.n) === asked || item.stage.id === asked)
    return found.length === 0 ? null : found
}

/** The variable names a `.env` text defines, and nothing else: a line `NAME=...` yields NAME when something follows the equals sign. The value is not captured. */
export const envNamesIn = (text: string): ReadonlyArray<string> =>
    text.split(/\r?\n/u).flatMap((line) => {
        const match = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(\S)?/u.exec(line)
        return match === null || match[1] === undefined || match[2] === undefined ? [] : [match[1]]
    })

/** Every variable name the keys look for, once each. */
export const keyNamesOf = (keys: ReadonlyArray<HarnessKey>): ReadonlyArray<string> => [
    ...new Set(keys.flatMap((key) => key.anyOf)),
]

/** What the key check found: the names present and the keys no name satisfies. Names only. */
export interface KeyCheck {
    /** The names present, in the order the plan lists them. */
    readonly present: ReadonlyArray<string>
    /** The keys with no name present. */
    readonly missing: ReadonlyArray<HarnessKey>
}

/** Checks the keys against the names that exist: the names present and the keys still missing. */
export const keyCheckOf = (keys: ReadonlyArray<HarnessKey>, has: (name: string) => boolean): KeyCheck => {
    const present = keyNamesOf(keys).filter((name) => has(name))
    return { present, missing: keys.filter((key) => !key.anyOf.some((name) => present.includes(name))) }
}
