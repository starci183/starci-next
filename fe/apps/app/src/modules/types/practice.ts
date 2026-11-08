/** The five languages the judge runs, as the practice door names them. */
export type PracticeLanguageId = "CPP" | "JAVA" | "JAVASCRIPT" | "PYTHON" | "TYPESCRIPT"

/** Every language of the editor, in the order the select offers them. */
export const PRACTICE_LANGUAGES: ReadonlyArray<PracticeLanguageId> = [
    "CPP",
    "JAVA",
    "JAVASCRIPT",
    "PYTHON",
    "TYPESCRIPT",
]

/** The language the editor opens on when the learner has no draft. */
export const DEFAULT_PRACTICE_LANGUAGE: PracticeLanguageId = "PYTHON"

/** Where the learner stands on a problem. */
export type PracticeProgress = "UNSOLVED" | "ATTEMPTED" | "ACCEPTED"

/** The verdict of a run or a submission; QUEUED and RUNNING are not final. */
export type PracticeOutcome =
    | "QUEUED"
    | "RUNNING"
    | "ACCEPTED"
    | "WRONG_ANSWER"
    | "TIME_LIMIT_EXCEEDED"
    | "COMPILE_ERROR"
    | "RUNTIME_ERROR"
    | "INTERNAL_ERROR"

/** One pattern (a family of problems) with the learner's progress in it. */
export type PracticePatternRow = {
    readonly patternId: string
    readonly title: string
    readonly problemCount: number
    readonly acceptedCount: number
    /** How many of its problems a reader without Premium may solve. */
    readonly freeCount: number
    /** True when the reader's plan opens none of its problems. */
    readonly locked: boolean
}

/** One row of a pattern's problem list. */
export type PracticeProblemItemView = {
    readonly slug: string
    readonly title: string
    readonly difficulty: string
    readonly tags: ReadonlyArray<string>
    readonly status: PracticeProgress
    readonly locked: boolean
    readonly orderIndex: number
}

/** The starter code of a problem in one language. */
type PracticeStarterView = { readonly language: PracticeLanguageId; readonly content: string }

/** A hint of the ladder, revealed to this learner. */
export type PracticeHintView = { readonly step: number; readonly title: string; readonly markdown: string }

/** One problem to solve; hidden tests and solutions never reach the client. */
export type PracticeProblemView = {
    readonly slug: string
    readonly title: string
    readonly patternId: string
    readonly patternTitle: string
    readonly difficulty: string
    readonly tags: ReadonlyArray<string>
    readonly statementMarkdown: string
    readonly timeLimitMs: number
    readonly memoryLimitKb: number
    readonly locked: boolean
    readonly starterCodes: ReadonlyArray<PracticeStarterView>
    readonly examples: ReadonlyArray<{ readonly input: string; readonly output: string }>
    readonly hintsTotal: number
    readonly hintsRevealed: ReadonlyArray<PracticeHintView>
    readonly status: PracticeProgress
    readonly nextSlug: string | null
}

/** One test of a run; only an example test carries its data. */
type PracticeTestView = {
    readonly index: number
    readonly passed: boolean
    readonly status: string
    readonly timeMs: number | null
    readonly memoryKb: number | null
    readonly example: {
        readonly input: string
        readonly expected: string
        readonly actual: string
    } | null
}

/** A run (examples only) or a submission (every test) and where it stands. */
export type PracticeSubmissionView = {
    readonly id: string
    readonly slug: string
    readonly language: PracticeLanguageId
    readonly kind: "RUN" | "SUBMIT"
    readonly verdict: PracticeOutcome
    readonly compileOutput: string | null
    /** Why the judge failed (JUDGE0_NOT_CONFIGURED, JUDGE0_UNAVAILABLE, ...) when the verdict is INTERNAL_ERROR; null otherwise. */
    readonly failureCode: string | null
    readonly tests: ReadonlyArray<PracticeTestView>
    readonly passedCount: number
    readonly totalCount: number
    readonly timeMs: number | null
    readonly memoryKb: number | null
}
