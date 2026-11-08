/** The languages the judge runs. */
export type Judge0Language = "cpp" | "java" | "javascript" | "python" | "typescript"

/** One test of a run: what the program reads and what it must print. */
export interface Judge0Case {
    /** The standard input. */
    readonly stdin: string
    /** The expected standard output; Judge0 compares it ignoring trailing whitespace. */
    readonly expectedOutput: string
}

/** One program judged against a list of tests under the same limits. */
export interface Judge0RunRequest {
    /** The correlation id of the calling request. */
    readonly correlationId: string
    /** The language of the source. */
    readonly language: Judge0Language
    /** The source code. */
    readonly source: string
    /** The tests, judged independently. */
    readonly cases: ReadonlyArray<Judge0Case>
    /** The CPU time limit of each test in milliseconds. */
    readonly cpuTimeLimitMs: number
    /** The memory limit of each test in kilobytes. */
    readonly memoryLimitKb: number
}

/** How Judge0 judged one test. */
export type Judge0Status =
    "accepted" | "wrong-answer" | "time-limit" | "compile-error" | "runtime-error" | "internal-error"

/** The judgement of one test. */
export interface Judge0CaseResult {
    /** How the test was judged. */
    readonly status: Judge0Status
    /** What the program printed, empty when it printed nothing. */
    readonly stdout: string
    /** What the program wrote to the error stream. */
    readonly stderr: string
    /** The compiler output, empty when the language does not compile or it compiled. */
    readonly compileOutput: string
    /** The CPU time in milliseconds, or null when it did not run. */
    readonly timeMs: number | null
    /** The peak memory in kilobytes, or null when it did not run. */
    readonly memoryKb: number | null
}
