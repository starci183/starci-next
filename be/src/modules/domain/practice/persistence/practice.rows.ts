import type {
    PracticeContent,
    PracticeExample,
    PracticeLocale,
    PracticeSolutions,
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
    /** Whether the learner revealed the reference solution. */
    solution_revealed: boolean
    /** Whether the reveal came before the first Accepted. */
    solution_viewed: boolean
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
    /** Whether the learner revealed the reference solution. */
    solution_revealed: boolean
    /** Whether the reveal came before the first Accepted. */
    solution_viewed: boolean
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

/** The introduction of one pattern in one locale. */
export interface PatternIntroRow {
    /** The pattern. */
    pattern_id: string
    /** The paragraph. */
    intro: string
}

/** The first problem a learner has not got accepted. */
export interface NextProblemRow {
    /** The slug. */
    problem_id: string
    /** The title in the asked locale. */
    title: string
    /** The pattern. */
    pattern_id: string
    /** The 1-based position inside the pattern. */
    position: number
    /** How many live problems the pattern has. */
    pattern_problem_count: number
}

/** The problem a learner submitted most recently without getting it accepted. */
export interface ResumeProblemRow {
    /** The slug. */
    problem_id: string
    /** The title in the asked locale. */
    title: string
    /** The pattern. */
    pattern_id: string
    /** How many graded submits the learner made. */
    attempts: number
    /** The verdict of the latest graded submit. */
    last_verdict: string
    /** The test summaries of the latest graded submit. */
    last_tests: ReadonlyArray<PracticeTestSummary>
}

/** The stored reference solution of the live version of a problem. */
export interface SolutionRow {
    /** The slug. */
    problem_id: string
    /** The reference code of each language. */
    solutions: PracticeSolutions
    /** The written explanation by locale. */
    explanations: Readonly<Record<PracticeLocale, string>>
}

/** The reveal of a solution by a learner. */
export interface SolutionRevealRow {
    /** When the learner first revealed it. */
    revealed_at: Date
    /** Whether the reveal came before the first Accepted. */
    viewed_before_accepted: boolean
}

/** What a learner has accepted and viewed in one pattern. */
export interface PatternCompletionRow {
    /** The pattern. */
    pattern_id: string
    /** How many live problems it has. */
    problem_count: number
    /** How many of them the learner got accepted. */
    accepted_count: number
    /** How many of them have a solution revealed before the first Accepted. */
    viewed_count: number
}

/** One graded submit of a learner with the title of its problem. */
export interface SubmissionHistoryRow {
    /** The submission id. */
    submission_id: string
    /** The problem slug. */
    problem_id: string
    /** The problem title in the locale. */
    title: string
    /** The language id. */
    language: string
    /** The stored verdict. */
    verdict: string
    /** How many tests passed. */
    passed_count: number
    /** How many tests the submission has. */
    total_count: number
    /** The slowest test time, or null. */
    time_ms: number | null
    /** The highest memory, or null. */
    memory_kb: number | null
    /** When it was sent. */
    created_at: Date
}

/** The language a learner solved most problems of a pattern in. */
export interface PatternLanguageRow {
    /** The language id. */
    language: string
}
