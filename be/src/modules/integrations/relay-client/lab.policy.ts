import type { LabAction, LabChaos, LabGrade, LabHiddenFile, LabSection, LabSource } from "./lab.contracts"
import { isRecord } from "./json.mapper"
import { isLessonId, isSafePath } from "./lesson.policy"

const COMMIT = /^[0-9a-f]{40}$/u
const SHA256 = /^[0-9a-f]{64}$/u
const SERVICE = /^[a-z0-9][a-z0-9._-]*$/u
const TEXT_ID = /^[A-Za-z0-9._:-]{1,120}$/u
const BASE64 = /^[A-Za-z0-9+/]*={0,2}$/u
const COMMAND = /^[^\r\n\0]{1,400}$/u
const ACTIONS: ReadonlyArray<string> = ["boot", "test", "chaos", "grade"]
const MAX_FILES = 64
const MAX_GRADE_BYTES = 1_048_576

/** The marker of the per-scenario command template, replaced by one scenario id. */
export const SCENARIO_ID_MARKER = "{id}"

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
const isCommand = (value: unknown): value is string => typeof value === "string" && COMMAND.test(value.trim())

/** The route StarCi serves a lab cut from: the only place a lab tarball is ever fetched from, with the device token. */
export const labSourcePathOf = (courseId: string, lessonId: string, cut: "bugs" | "solution"): string =>
    `/api/relay/courses/${courseId}/${lessonId}/${cut}.tgz`

const chaosOf = (value: unknown): LabChaos | null => {
    if (!isRecord(value)) return null
    const { id, on, off } = value
    return isId(id) && isCommand(on) && isCommand(off) ? { id, on, off } : null
}

/** A tarball link: StarCi's own route for this lab and cut, a sha256 and a 40-hex commit; anything else is refused. */
const sourceOf = (value: unknown, expectedUrl: string): LabSource | null => {
    if (!isRecord(value)) return null
    const { url, sha256, commit } = value
    if (url !== expectedUrl) return null
    if (typeof sha256 !== "string" || !SHA256.test(sha256)) return null
    if (typeof commit !== "string" || !COMMIT.test(commit)) return null
    return { url, sha256, commit }
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
    const { submissionId, nonce, command } = value
    if (!isTextId(submissionId) || !isTextId(nonce) || !isCommand(command)) return null
    const { report } = value
    if (report !== undefined && !isLabPath(report)) return null
    const seedOrder = listOf(value.seedOrder, isTextId)
    const rawFiles: unknown = value.files
    if (seedOrder === null || seedOrder.length === 0 || !Array.isArray(rawFiles) || rawFiles.length > MAX_FILES)
        return null
    const files = (rawFiles as ReadonlyArray<unknown>).map((file) => hiddenOf(file))
    if (files.includes(null)) return null
    const read = files.filter((file) => file !== null)
    if (read.reduce((sum, file) => sum + file.bytes, 0) > MAX_GRADE_BYTES) return null
    return {
        submissionId,
        nonce,
        command,
        ...(report === undefined ? {} : { report }),
        seedOrder,
        files: read.map(({ path, sha256: hash, content }) => ({ path, sha256: hash, content })),
    }
}

const timedCommandOf = (value: unknown): value is Record<string, unknown> & { readonly command: string } =>
    isRecord(value) && isCommand(value.command) && isTimeout(value.timeoutMs)

/** The optional seed of a payload whose seed already passed `timedCommandOf`. */
const timedSeedOf = (value: unknown): { readonly seed?: { readonly command: string; readonly timeoutMs: number } } =>
    timedCommandOf(value) ? { seed: { command: value.command, timeoutMs: Number(value.timeoutMs) } } : {}

/** The task id a lab manifest is for. */
export const labTaskIdOf = (lab: Pick<LabSection, "courseId" | "lessonId">): string =>
    `course:${lab.courseId}/${lab.lessonId}`

/** The lab section of a payload: undefined when absent, null when present but malformed in any part. */
export const labOf = (value: unknown): LabSection | null | undefined => {
    if (value === undefined) return undefined
    if (!isRecord(value) || !isRecord(value.test)) return null
    const { courseId, lessonId, dir, compose, project, action } = value
    if (!isId(courseId) || !isId(lessonId) || !isLabPath(dir) || !isLabPath(compose) || !isId(project)) return null
    if (typeof action !== "string" || !ACTIONS.includes(action)) return null
    const source = sourceOf(value.source, labSourcePathOf(courseId, lessonId, "bugs"))
    const solution =
        value.solution === undefined
            ? undefined
            : sourceOf(value.solution, labSourcePathOf(courseId, lessonId, "solution"))
    if (source === null || solution === null) return null
    const { command, scenario, report, timeoutMs } = value.test
    if (!isCommand(command) || !isCommand(scenario) || !scenario.includes(SCENARIO_ID_MARKER)) return null
    if (!isLabPath(report) || !isTimeout(timeoutMs)) return null
    const { install } = value.test
    if (install !== undefined && !isCommand(install)) return null
    if (value.seed !== undefined && !timedCommandOf(value.seed)) return null
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
    // Only the type is checked here: an unsafe folder must reach `labFolderChoiceOf` and be refused aloud, not vanish as a malformed manifest.
    if (value.learnerDir !== undefined && typeof value.learnerDir !== "string") return null
    const grade = value.grade === undefined ? undefined : gradeOf(value.grade)
    if (grade === null || (action === "grade") !== (grade !== undefined)) return null
    return {
        courseId,
        lessonId,
        source,
        ...(solution === undefined ? {} : { solution }),
        ...(value.learnerDir === undefined ? {} : { learnerDir: value.learnerDir }),
        dir,
        compose,
        project,
        services,
        ...timedSeedOf(value.seed),
        test: { command, scenario, report, timeoutMs, ...(install === undefined ? {} : { install }) },
        files,
        chaos: known,
        chaosOn,
        action: action as LabAction,
        ...(grade === undefined ? {} : { grade }),
    }
}

/**
 * What turning the chaos on and off takes, in order: the `off` commands of the switches that leave `chaosOn` (they were on) and then the
 * `on` commands of the switches that enter it. A switch in both lists, or in neither, runs nothing.
 */
export const chaosStepsOf = (
    lab: Pick<LabSection, "chaos">,
    before: ReadonlyArray<string>,
    after: ReadonlyArray<string>,
): ReadonlyArray<{ readonly id: string; readonly turn: "on" | "off"; readonly command: string }> => [
    ...lab.chaos
        .filter((item) => before.includes(item.id) && !after.includes(item.id))
        .map((item) => ({ id: item.id, turn: "off" as const, command: item.off })),
    ...lab.chaos
        .filter((item) => after.includes(item.id) && !before.includes(item.id))
        .map((item) => ({ id: item.id, turn: "on" as const, command: item.on })),
]
