import type {
    PracticeContent,
    PracticeExample,
    PracticeStarterCodes,
    PracticeTest,
    PracticeTestSummary,
} from "../practice.contracts"

/** The live version of a problem as a read needs it: public text, starter codes and examples, never a test or a solution. */
export interface ProblemRow {
    /** The slug. */
    problem_id: string
    /** The version label. */
    version: string
    /** The pattern. */
    pattern_id: string
    /** The position inside the pattern. */
    order_index: number
    /** The difficulty. */
    difficulty: string
    /** The tags. */
    tags: ReadonlyArray<string>
    /** The CPU time limit in milliseconds. */
    time_limit_ms: number
    /** The memory limit in kilobytes. */
    memory_limit_kb: number
    /** The public text by locale. */
    content: PracticeContent
    /** The starter codes. */
    starter_codes: PracticeStarterCodes
    /** The public examples. */
    examples: ReadonlyArray<PracticeExample>
    /** How many live problems of the pattern come before this one. */
    rank: number
    /** The slug of the next live problem of the pattern, or null. */
    next_slug: string | null
}

/** A problem as the judge needs it: the limits, the examples and the hidden tests. */
export interface JudgingRow {
    /** The slug. */
    problem_id: string
    /** The version label. */
    version: string
    /** The pattern. */
    pattern_id: string
    /** The CPU time limit in milliseconds. */
    time_limit_ms: number
    /** The memory limit in kilobytes. */
    memory_limit_kb: number
    /** The public examples. */
    examples: ReadonlyArray<PracticeExample>
    /** The hidden tests. */
    tests: ReadonlyArray<PracticeTest>
    /** How many live problems of the pattern come before this one. */
    rank: number
}

/** One row of a pattern list: the problem with the standing of the viewer. */
export interface ProblemListRow {
    /** The slug. */
    problem_id: string
    /** The title in the asked locale. */
    title: string
    /** The difficulty. */
    difficulty: string
    /** The tags. */
    tags: ReadonlyArray<string>
    /** The position inside the pattern. */
    order_index: number
    /** `unsolved`, `attempted` or `accepted`. */
    status: string
}

/** The counts of one pattern for one learner. */
export interface PatternCountRow {
    /** The pattern. */
    pattern_id: string
    /** How many live problems it has. */
    problem_count: number
    /** How many of them the learner got accepted. */
    accepted_count: number
}

/** The standing of a learner on one problem. */
export interface StatusRow {
    /** `unsolved`, `attempted` or `accepted`. */
    status: string
}

/** One stored submission. */
export interface SubmissionRow {
    /** The submission id. */
    submission_id: string
    /** The learner. */
    learner_id: string
    /** The problem slug. */
    problem_id: string
    /** The problem version. */
    problem_version: string
    /** The language. */
    language: string
    /** `run` or `submit`. */
    kind: string
    /** The verdict. */
    verdict: string
    /** The stable code of an internal error, or null. */
    failure_code: string | null
    /** The compiler output, or null. */
    compile_output: string | null
    /** The summary of each test. */
    tests: ReadonlyArray<PracticeTestSummary>
    /** How many tests passed. */
    passed_count: number
    /** How many tests the submission has. */
    total_count: number
    /** The slowest test in milliseconds, or null. */
    time_ms: number | null
    /** The highest memory in kilobytes, or null. */
    memory_kb: number | null
    /** When it was sent. */
    created_at: Date
}

/** How many submissions of a learner are recent and how many are still in flight. */
export interface RateRow {
    /** Submissions created since the start of the window. */
    recent: number
    /** Submissions still queued or running and not stale. */
    in_flight: number
}

/** The highest hint step a learner opened on a problem; null before any. */
export interface HintMaxRow {
    /** The highest step. */
    highest: number | null
}

/** One revealed hint step. */
export interface HintStepRow {
    /** The step. */
    step: number
}

/** The id and hash of a stored version. */
export interface VersionHashRow {
    /** The hash of the source files. */
    content_hash: string
}
