import type { HiddenFile, LessonGuard, LessonScenario, LessonSection } from "./lesson.contracts"
import { isRecord } from "./json.mapper"

const ID = /^[a-z0-9-]+$/u
const ENV = /^[A-Z][A-Z0-9_]*$/u
const COMMIT = /^[0-9a-f]{40}$/u
const SOURCE_URL = /^(?:https:\/\/[^\s"'<>\\]+|\/[^\s"'<>\\]*)$/u
const SHA256 = /^[0-9a-f]{64}$/u
const SAFE_PATH = /^[A-Za-z0-9._@/-]+$/u
const MAX_FILES = 64
const MAX_FILE_BYTES = 1_048_576

/** True when a lesson or scenario id is well formed. */
export const isLessonId = (value: string): boolean => ID.test(value)

/** True when a path is relative, safe to hand to a shell and stays inside its folder. */
export const isSafePath = (path: unknown): path is string =>
    typeof path === "string" && SAFE_PATH.test(path) && !path.startsWith("/") && !path.split("/").includes("..")

const guardOf = (value: unknown): LessonGuard | null => {
    if (!isRecord(value)) return null
    const { name, env, off } = value
    const ok = typeof name === "string" && ID.test(name) && typeof env === "string" && ENV.test(env)
    return ok && typeof off === "string" && ID.test(off) ? { name, env, off } : null
}

const fileOf = (value: unknown): (HiddenFile & { readonly bytes: number }) | null => {
    if (!isRecord(value) || !isSafePath(value.path) || typeof value.contentBase64 !== "string") return null
    if (!/^[A-Za-z0-9+/]*={0,2}$/u.test(value.contentBase64)) return null
    return {
        path: value.path,
        contentBase64: value.contentBase64,
        bytes: Buffer.from(value.contentBase64, "base64").length,
    }
}

/** An optional array field: [] when absent, null when present but not an array. */
const listOf = (value: unknown): ReadonlyArray<unknown> | null =>
    value === undefined ? [] : Array.isArray(value) ? (value as ReadonlyArray<unknown>) : null

/** One scenario, or null when any part is malformed. */
const scenarioOf = (value: unknown): LessonScenario | null => {
    if (!isRecord(value)) return null
    const { id, title, brief, command, cwd, report, timeoutMs, concepts } = value
    if (typeof id !== "string" || !ID.test(id)) return null
    if (typeof title !== "string" || typeof command !== "string" || command.length === 0) return null
    if (!isSafePath(cwd) || !isSafePath(report)) return null
    if (typeof timeoutMs !== "number" || !Number.isSafeInteger(timeoutMs) || timeoutMs <= 0) return null
    if (!Array.isArray(concepts) || !concepts.every((c) => typeof c === "string" && ID.test(c))) return null
    const rawGuards = listOf(value.guards)
    const rawFiles = listOf(value.files)
    if (rawGuards === null || rawFiles === null || rawFiles.length > MAX_FILES) return null
    const guards = rawGuards.map((guard) => guardOf(guard))
    const files = rawFiles.map((file) => fileOf(file))
    if (guards.includes(null) || files.includes(null)) return null
    const checked = files.filter((file) => file !== null)
    if (checked.reduce((sum, file) => sum + file.bytes, 0) > MAX_FILE_BYTES) return null
    return {
        id,
        title,
        brief: typeof brief === "string" ? brief : "",
        concepts: concepts.map(String),
        command,
        cwd,
        report,
        timeoutMs,
        guards: guards.filter((guard) => guard !== null),
        files: checked.map(({ path, contentBase64 }) => ({ path, contentBase64 })),
    }
}

const scenariosOf = (value: unknown): ReadonlyArray<LessonScenario> | null => {
    if (!Array.isArray(value)) return null
    const read = (value as ReadonlyArray<unknown>).map((item) => scenarioOf(item))
    return read.includes(null) ? null : read.filter((item) => item !== null)
}

const invariantsOf = (value: unknown): Readonly<Record<string, string>> | null => {
    if (value === undefined) return {}
    if (!isRecord(value)) return null
    const entries = Object.entries(value)
    if (!entries.every(([id, name]) => ID.test(id) && typeof name === "string")) return null
    return Object.fromEntries(entries.map(([id, name]) => [id, String(name)]))
}

/** The lesson section of a payload: undefined when absent, null when present but malformed. */
export const lessonOf = (value: unknown): LessonSection | null | undefined => {
    if (value === undefined) return undefined
    if (!isRecord(value) || !isRecord(value.source)) return null
    const { lessonId, dir, compose, project } = value
    const { url, commit, sha256 } = value.source
    if (typeof lessonId !== "string" || !ID.test(lessonId)) return null
    if (typeof url !== "string" || !SOURCE_URL.test(url) || url.includes("@")) return null
    if (typeof sha256 !== "string" || !SHA256.test(sha256)) return null
    if (typeof commit !== "string" || !COMMIT.test(commit)) return null
    if (!isSafePath(dir) || !isSafePath(compose) || typeof project !== "string" || !ID.test(project)) return null
    const scenarios = scenariosOf(value.scenarios)
    const invariants = invariantsOf(value.invariants)
    if (scenarios === null || invariants === null) return null
    const base = { lessonId, source: { url, sha256, commit }, dir, compose, project, invariants, scenarios }
    if (value.challenge === undefined) return base
    if (!isRecord(value.challenge) || typeof value.challenge.tier !== "string" || !ID.test(value.challenge.tier))
        return null
    const hidden = scenariosOf(value.challenge.scenarios)
    return hidden === null ? null : { ...base, challenge: { tier: value.challenge.tier, scenarios: hidden } }
}
