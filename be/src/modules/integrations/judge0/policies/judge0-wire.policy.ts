import type { Judge0Case, Judge0CaseResult, Judge0RunRequest, Judge0Language, Judge0Status } from "../judge0.contracts"

/** The Judge0 language id of each language, as the teacher's audited runs name them. */
export const JUDGE0_LANGUAGE_IDS: Readonly<Record<Judge0Language, number>> = {
    cpp: 54,
    java: 62,
    javascript: 63,
    python: 71,
    typescript: 74,
}

/** The most submissions Judge0 takes in one batch call by default. */
export const JUDGE0_BATCH_LIMIT = 20

/** The Judge0 status ids that mean the submission is not judged yet: in queue and processing. */
const PENDING_STATUS_IDS: ReadonlySet<number> = new Set([1, 2])

const encode = (text: string): string => Buffer.from(text, "utf8").toString("base64")

const decode = (value: unknown): string =>
    typeof value === "string" ? Buffer.from(value, "base64").toString("utf8") : ""

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null && !Array.isArray(value)

/** The body of a batch create: one submission per test. */
export interface Judge0BatchBody {
    /** The submissions to create. */
    readonly submissions: ReadonlyArray<Record<string, unknown>>
}

/** The body that creates a batch of submissions for the tests of a run; text fields are base64 as Judge0 asks. */
export const judge0BatchBody = (
    request: Judge0RunRequest,
    cases: ReadonlyArray<Judge0Case>,
    languageId: number,
): Judge0BatchBody => ({
    submissions: cases.map((test) => ({
        language_id: languageId,
        source_code: encode(request.source),
        stdin: encode(test.stdin),
        expected_output: encode(test.expectedOutput),
        cpu_time_limit: request.cpuTimeLimitMs / 1000,
        memory_limit: request.memoryLimitKb,
    })),
})

/** The tokens a create answer names, or null when the answer is not one token per submission. */
export const judge0TokensOf = (body: unknown, expected: number): ReadonlyArray<string> | null => {
    if (!Array.isArray(body) || body.length !== expected) return null
    const tokens = body.map((entry: unknown) =>
        isRecord(entry) && typeof entry["token"] === "string" ? entry["token"] : "",
    )
    return tokens.every((token) => token !== "") ? tokens : null
}

/** The status of a Judge0 status id: 3 accepted, 4 wrong answer, 5 time limit, 6 compile error, 7 to 12 runtime errors, the rest internal. */
export const judge0StatusOf = (statusId: number): Judge0Status => {
    if (statusId === 3) return "accepted"
    if (statusId === 4) return "wrong-answer"
    if (statusId === 5) return "time-limit"
    if (statusId === 6) return "compile-error"
    return statusId >= 7 && statusId <= 12 ? "runtime-error" : "internal-error"
}

const secondsToMs = (value: unknown): number | null => {
    const seconds = typeof value === "string" ? Number(value) : value
    return typeof seconds === "number" && Number.isFinite(seconds) ? Math.round(seconds * 1000) : null
}

const kilobytes = (value: unknown): number | null =>
    typeof value === "number" && Number.isFinite(value) ? Math.round(value) : null

/** The status id of a read submission, or null when the entry is not a submission with a numeric status id. */
export const judge0StatusIdOf = (entry: unknown): number | null => {
    if (!isRecord(entry)) return null
    const status = entry["status"]
    const id = isRecord(status) ? status["id"] : undefined
    return typeof id === "number" ? id : null
}

/** Whether Judge0 still holds the submission: in queue or processing. */
export const judge0IsPending = (entry: unknown): boolean => PENDING_STATUS_IDS.has(judge0StatusIdOf(entry) ?? 0)

/** One judged submission, or null when the entry is not a submission (or is not judged yet). */
export const judge0ResultOf = (entry: unknown): Judge0CaseResult | null => {
    if (!isRecord(entry)) return null
    const id = judge0StatusIdOf(entry)
    if (id === null || PENDING_STATUS_IDS.has(id)) return null
    return {
        status: judge0StatusOf(id),
        stdout: decode(entry["stdout"]),
        stderr: decode(entry["stderr"]),
        compileOutput: decode(entry["compile_output"]),
        timeMs: secondsToMs(entry["time"]),
        memoryKb: kilobytes(entry["memory"]),
    }
}

/** The judged submissions among the entries of a batch read, in order; an entry that is not judged yet gives none. */
export const judge0ResultsOf = (entries: ReadonlyArray<unknown>): ReadonlyArray<Judge0CaseResult> =>
    entries.flatMap((entry) => {
        const result = judge0ResultOf(entry)
        return result === null ? [] : [result]
    })

/** The submissions of a batch read, in the order of the tokens asked; null when the answer is not a batch of that size. */
export const judge0EntriesOf = (body: unknown, expected: number): ReadonlyArray<unknown> | null => {
    const list = isRecord(body) ? body["submissions"] : undefined
    return Array.isArray(list) && list.length === expected ? list : null
}

/** The read fields of a batch: only what the result needs, so the answer stays small. */
export const JUDGE0_READ_FIELDS = "token,status,stdout,stderr,compile_output,time,memory"
