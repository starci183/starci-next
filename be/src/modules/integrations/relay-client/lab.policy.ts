import type { LabAction, LabChaos, LabGrade, LabHiddenFile, LabSection } from "./lab.contracts"
import { isRecord } from "./json.mapper"
import { isLessonId, isSafePath } from "./lesson.policy"

const ENV = /^[A-Z][A-Z0-9_]*$/u
const COMMIT = /^[0-9a-f]{40}$/u
const SHA256 = /^[0-9a-f]{64}$/u
const REPO_URL = /^https:\/\/[A-Za-z0-9._~/:%+-]+$/u
const BRANCH = /^[A-Za-z0-9][A-Za-z0-9._/-]*$/u
const SERVICE = /^[a-z0-9][a-z0-9._-]*$/u
const TEXT_ID = /^[A-Za-z0-9._:-]{1,120}$/u
const BASE64 = /^[A-Za-z0-9+/]*={0,2}$/u
const CHAOS_VALUE = /^[^\r\n\0]{0,200}$/u
const ACTIONS: ReadonlyArray<string> = ["boot", "test", "chaos", "grade"]
const MAX_FILES = 64
const MAX_GRADE_BYTES = 1_048_576

/** True for a positive whole number of milliseconds. */
const isTimeout = (value: unknown): value is number =>
    typeof value === "number" && Number.isSafeInteger(value) && value > 0

/** True for a path the lab may touch: relative, safe for a shell, inside its folder and not git's own. */
export const isLabPath = (value: unknown): value is string =>
    isSafePath(value) && value !== ".git" && !value.startsWith(".git/")

/** A list whose every item passes `test`, or null. */
const listOf = <T>(value: unknown, test: (item: unknown) => item is T): ReadonlyArray<T> | null =>
    Array.isArray(value) && (value as ReadonlyArray<unknown>).every((item) => test(item))
        ? (value as ReadonlyArray<T>)
        : null

const isId = (value: unknown): value is string => typeof value === "string" && isLessonId(value)
const isService = (value: unknown): value is string => typeof value === "string" && SERVICE.test(value)
const isTextId = (value: unknown): value is string => typeof value === "string" && TEXT_ID.test(value)

const chaosOf = (value: unknown): LabChaos | null => {
    if (!isRecord(value)) return null
    const { id, env, value: setting } = value
    const ok = isId(id) && typeof env === "string" && ENV.test(env)
    return ok && typeof setting === "string" && CHAOS_VALUE.test(setting) ? { id, env, value: setting } : null
}

const hiddenOf = (value: unknown): (LabHiddenFile & { readonly bytes: number }) | null => {
    if (!isRecord(value) || !isLabPath(value.path)) return null
    const { sha256, content } = value
    if (typeof sha256 !== "string" || !SHA256.test(sha256)) return null
    if (typeof content !== "string" || !BASE64.test(content)) return null
    return { path: value.path, sha256, content, bytes: Buffer.from(content, "base64").length }
}

const gradeOf = (value: unknown): LabGrade | null => {
    if (!isRecord(value)) return null
    const { submissionId, nonce, commit } = value
    if (!isTextId(submissionId) || !isTextId(nonce) || typeof commit !== "string" || !COMMIT.test(commit)) return null
    const seedOrder = listOf(value.seedOrder, isTextId)
    const rawFiles: unknown = value.files
    if (seedOrder === null || !Array.isArray(rawFiles) || rawFiles.length > MAX_FILES) return null
    const files = (rawFiles as ReadonlyArray<unknown>).map((file) => hiddenOf(file))
    if (files.includes(null)) return null
    const read = files.filter((file) => file !== null)
    if (read.reduce((sum, file) => sum + file.bytes, 0) > MAX_GRADE_BYTES) return null
    return {
        submissionId,
        nonce,
        commit,
        seedOrder,
        files: read.map(({ path, sha256, content }) => ({ path, sha256, content })),
    }
}

const commandOf = (value: unknown): value is Record<string, unknown> & { readonly command: string } =>
    isRecord(value) && typeof value.command === "string" && value.command.trim() !== "" && isTimeout(value.timeoutMs)

/** The task id a lab manifest is for. */
export const labTaskIdOf = (lab: Pick<LabSection, "courseId" | "lessonId">): string =>
    `course:${lab.courseId}/${lab.lessonId}`

/** The lab section of a payload: undefined when absent, null when present but malformed in any part. */
export const labOf = (value: unknown): LabSection | null | undefined => {
    if (value === undefined) return undefined
    if (!isRecord(value) || !isRecord(value.repo) || !isRecord(value.test)) return null
    const { courseId, lessonId, compose, project, action } = value
    if (!isId(courseId) || !isId(lessonId) || !isLabPath(compose) || !isId(project)) return null
    if (typeof action !== "string" || !ACTIONS.includes(action)) return null
    const { url, branch, commit } = value.repo
    if (typeof url !== "string" || !REPO_URL.test(url)) return null
    if (typeof branch !== "string" || !BRANCH.test(branch) || branch.includes("..")) return null
    if (commit !== null && (typeof commit !== "string" || !COMMIT.test(commit))) return null
    if (!commandOf(value.seed) || !commandOf(value.test) || !isLabPath(value.test.report)) return null
    const services = listOf(value.services, isService)
    const files = listOf(value.files, isLabPath)
    const rawChaos: unknown = value.chaos
    const chaos = Array.isArray(rawChaos) ? (rawChaos as ReadonlyArray<unknown>).map((item) => chaosOf(item)) : null
    const chaosOn = listOf(value.chaosOn, isId)
    if (services === null || files === null || files.length > MAX_FILES || chaos === null || chaosOn === null)
        return null
    if (chaos.includes(null)) return null
    const known = chaos.filter((item) => item !== null)
    if (!chaosOn.every((id) => known.some((item) => item.id === id))) return null
    const grade = value.grade === undefined ? undefined : gradeOf(value.grade)
    if (grade === null || (action === "grade") !== (grade !== undefined)) return null
    return {
        courseId,
        lessonId,
        repo: { url, branch, commit },
        compose,
        project,
        services,
        seed: { command: value.seed.command, timeoutMs: Number(value.seed.timeoutMs) },
        test: { command: value.test.command, report: value.test.report, timeoutMs: Number(value.test.timeoutMs) },
        files,
        chaos: known,
        chaosOn,
        action: action as LabAction,
        ...(grade === undefined ? {} : { grade }),
    }
}

/** The environment the chaos ids switched on set: their variables and values, and nothing else. */
export const chaosEnvOf = (lab: LabSection): Readonly<Record<string, string>> =>
    Object.fromEntries(
        lab.chaos.filter((item) => lab.chaosOn.includes(item.id)).map((item) => [item.env, item.value]),
    )
