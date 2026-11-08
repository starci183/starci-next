/** The languages a problem has a starter code for, in the order the editor lists them. */
export const PRACTICE_LANGUAGES = ["cpp", "java", "javascript", "python", "typescript"] as const

/** One language of the judge. */
export type PracticeLanguage = (typeof PRACTICE_LANGUAGES)[number]

/** The locales a problem is written in. */
export const PRACTICE_LOCALES = ["vi", "en"] as const

/** One locale of a problem. */
export type PracticeLocale = (typeof PRACTICE_LOCALES)[number]

/** The difficulty the teacher gave a problem. */
export type PracticeDifficulty = "easy" | "medium" | "hard"

/** The steps of the hint ladder: analysis, approach, related problems. */
export const PRACTICE_HINT_STEPS = [1, 2, 3] as const

/** One hint of the ladder as the teacher wrote it: a title and prose, never generated code. */
export interface PracticeHintText {
    /** The step, 1 to 3. */
    readonly step: number
    /** The title of the step. */
    readonly title: string
    /** The prose of the step in markdown. */
    readonly markdown: string
}

/** The text of one locale of a problem. */
export interface PracticeLocaleText {
    /** The title. */
    readonly title: string
    /** The statement in markdown. */
    readonly statement: string
    /** The three steps of the hint ladder. */
    readonly hints: ReadonlyArray<PracticeHintText>
}

/** One public example of a problem: what the program reads and what it prints. */
export interface PracticeExample {
    /** The standard input. */
    readonly input: string
    /** The expected standard output. */
    readonly output: string
}

/** One hidden test of a problem; never leaves the server. */
export interface PracticeTest {
    /** The standard input. */
    readonly input: string
    /** The expected standard output. */
    readonly output: string
}

/** The starter code of each language. */
export type PracticeStarterCodes = Readonly<Record<PracticeLanguage, string>>

/** The reference solution of each language; never leaves the server. */
export type PracticeSolutions = Readonly<Record<PracticeLanguage, string>>

/** The public content of a problem version: its text by locale. */
export type PracticeContent = Readonly<Record<PracticeLocale, PracticeLocaleText>>

/** One source file of a problem folder: its text and the hash of its raw bytes. */
export interface PracticeSourceFile {
    /** The posix path relative to the problem folder. */
    readonly path: string
    /** The decoded text. */
    readonly text: string
    /** The lowercase hex SHA-256 of the raw bytes. */
    readonly sha256: string
}

/** One problem folder of the data directory: the pattern it sits under and its slug. */
export interface PracticeSourceEntry {
    /** The pattern (the domain folder). */
    readonly pattern: string
    /** The problem slug (the folder name). */
    readonly slug: string
}

/** One problem found while importing, with the file and field that hold it. */
export interface PracticeIssue {
    /** The file of the problem folder. */
    readonly path: string
    /** The field inside the file, or an empty text for the file itself. */
    readonly field: string
    /** What is wrong, in words for the author. */
    readonly message: string
}

/** A problem folder read, parsed and validated, ready to store. */
export interface PracticeDraft {
    /** The stable id: the folder name. */
    readonly id: string
    /** The pattern the problem trains. */
    readonly patternId: string
    /** The position inside the pattern. */
    readonly orderIndex: number
    /** The difficulty. */
    readonly difficulty: PracticeDifficulty
    /** The tags. */
    readonly tags: ReadonlyArray<string>
    /** The CPU time limit of a test in milliseconds. */
    readonly timeLimitMs: number
    /** The memory limit of a test in kilobytes. */
    readonly memoryLimitKb: number
    /** The public text by locale. */
    readonly content: PracticeContent
    /** The starter code of each language. */
    readonly starterCodes: PracticeStarterCodes
    /** The public examples. */
    readonly examples: ReadonlyArray<PracticeExample>
    /** The hidden tests. */
    readonly tests: ReadonlyArray<PracticeTest>
    /** The reference solutions. */
    readonly solutions: PracticeSolutions
    /** The SHA-256 over the sorted path and hash lines of every source file. */
    readonly contentHash: string
    /** The SHA-256 of every source file by posix path. */
    readonly sourceHashes: Readonly<Record<string, string>>
}

/** What the import of one problem folder did. */
export interface PracticeImportReport {
    /** The problem folder. */
    readonly folder: string
    /** The pattern. */
    readonly pattern: string
    /** The version label. */
    readonly version: string
    /** `created`, `unchanged`, `refused` (other bytes under a stored version) or `invalid`. */
    readonly status: "created" | "unchanged" | "refused" | "invalid"
    /** How many tests the problem has. */
    readonly tests: number
    /** The issues that blocked an invalid folder. */
    readonly issues: ReadonlyArray<PracticeIssue>
}

/** What the importer is asked to import. */
export interface ImportPracticeParams {
    /** The directory that holds the `sets` folder of the teacher's coding problems. */
    readonly directory: string
    /** The version label, a git sha. */
    readonly ref: string
    /** The pattern folders to import; empty for every pattern. */
    readonly only: string
}

/** How a learner stands on a problem. */
export type PracticeStatus = "unsolved" | "attempted" | "accepted"

/** One pattern with the numbers of the viewer. */
export interface PracticePatternView {
    /** The pattern id. */
    readonly patternId: string
    /** The title in the locale. */
    readonly title: string
    /** How many live problems the pattern has. */
    readonly problemCount: number
    /** How many of them the viewer got accepted. */
    readonly acceptedCount: number
    /** How many of them the viewer may open without Premium. */
    readonly freeCount: number
    /** Whether the viewer, without Premium, can open only part of the pattern. */
    readonly locked: boolean
}

/** One problem of a pattern list. */
export interface PracticeProblemItemView {
    /** The slug. */
    readonly slug: string
    /** The title in the locale. */
    readonly title: string
    /** The difficulty. */
    readonly difficulty: PracticeDifficulty
    /** The tags. */
    readonly tags: ReadonlyArray<string>
    /** How the viewer stands on it. */
    readonly status: PracticeStatus
    /** Whether the viewer needs Premium to open it. */
    readonly locked: boolean
    /** The position inside the pattern. */
    readonly orderIndex: number
}

/** The starter code of one language. */
export interface PracticeStarterCodeView {
    /** The language. */
    readonly language: PracticeLanguage
    /** The starter code. */
    readonly content: string
}

/** One problem as the learner opens it: the statement, the examples and the starter codes, no test, no solution. */
export interface PracticeProblemView {
    /** The slug. */
    readonly slug: string
    /** The title in the locale. */
    readonly title: string
    /** The pattern id. */
    readonly patternId: string
    /** The title of the pattern in the locale. */
    readonly patternTitle: string
    /** The difficulty. */
    readonly difficulty: PracticeDifficulty
    /** The tags. */
    readonly tags: ReadonlyArray<string>
    /** The statement in markdown. */
    readonly statementMarkdown: string
    /** The CPU time limit of a test in milliseconds. */
    readonly timeLimitMs: number
    /** The memory limit of a test in kilobytes. */
    readonly memoryLimitKb: number
    /** Whether the viewer needs Premium to run it; a locked problem answers its statement only. */
    readonly locked: boolean
    /** The starter code of each language; empty when locked. */
    readonly starterCodes: ReadonlyArray<PracticeStarterCodeView>
    /** The public examples; empty when locked. */
    readonly examples: ReadonlyArray<PracticeExample>
    /** How many steps the hint ladder has. */
    readonly hintsTotal: number
    /** The steps the viewer has revealed, in order. */
    readonly hintsRevealed: ReadonlyArray<PracticeHintText>
    /** How the viewer stands on it. */
    readonly status: PracticeStatus
    /** The slug of the next problem of the pattern, or null at the last. */
    readonly nextSlug: string | null
}

/** The verdict of a submission. */
export type PracticeVerdict =
    | "queued"
    | "running"
    | "accepted"
    | "wrong-answer"
    | "time-limit-exceeded"
    | "compile-error"
    | "runtime-error"
    | "internal-error"

/** Whether a submission runs the example only or every test. */
export type PracticeSubmissionKind = "run" | "submit"

/** What the learner may see of the example a run executed: public, so shown in full. */
export interface PracticeExampleResult {
    /** The standard input of the example. */
    readonly input: string
    /** The expected output. */
    readonly expected: string
    /** What the program printed. */
    readonly actual: string
}

/** The summary of one test: never its input or expected output, except for a run's public example. */
export interface PracticeTestSummary {
    /** The position of the test; the example of a run is 0. */
    readonly index: number
    /** Whether the program printed what the test expects. */
    readonly passed: boolean
    /** The Judge0 status of the test. */
    readonly status: string
    /** The CPU time in milliseconds, or null. */
    readonly timeMs: number | null
    /** The peak memory in kilobytes, or null. */
    readonly memoryKb: number | null
    /** The example with what the program printed; only for a run. */
    readonly example: PracticeExampleResult | null
}

/** A submission as the learner reads it. */
export interface PracticeSubmissionView {
    /** The submission id. */
    readonly id: string
    /** The problem slug. */
    readonly slug: string
    /** The language. */
    readonly language: PracticeLanguage
    /** Run or submit. */
    readonly kind: PracticeSubmissionKind
    /** Where the submission stands. */
    readonly verdict: PracticeVerdict
    /** The compiler output of a compile error, or null. */
    readonly compileOutput: string | null
    /** The stable code of an internal error (the judge was not configured, did not answer), or null. */
    readonly failureCode: string | null
    /** The summary of each test judged so far. */
    readonly tests: ReadonlyArray<PracticeTestSummary>
    /** How many tests passed. */
    readonly passedCount: number
    /** How many tests the submission has. */
    readonly totalCount: number
    /** The slowest test time in milliseconds, or null. */
    readonly timeMs: number | null
    /** The highest memory in kilobytes, or null. */
    readonly memoryKb: number | null
    /** When the submission was made. */
    readonly createdAt: Date
}

/** The readiness of a learner in one pattern: how many problems they got accepted. */
export interface PracticeReadinessView {
    /** The pattern id. */
    readonly patternId: string
    /** The title in the locale. */
    readonly title: string
    /** How many live problems the pattern has. */
    readonly problemCount: number
    /** How many of them the learner got accepted. */
    readonly acceptedCount: number
}

/** A read for a learner in a locale. */
export interface PracticeReadParams {
    /** The learner. */
    readonly learnerId: string
    /** The locale of the text. */
    readonly locale: PracticeLocale
}

/** A read of the problems of one pattern. */
export interface PracticePatternParams extends PracticeReadParams {
    /** The pattern id. */
    readonly patternId: string
}

/** A read of one problem. */
export interface PracticeProblemParams extends PracticeReadParams {
    /** The problem slug. */
    readonly slug: string
}

/** The opening of one hint step of a problem. */
export interface PracticeHintParams extends PracticeProblemParams {
    /** The step, from 1 to 3. */
    readonly step: number
}

/** A request to run or submit a solution. */
export interface PracticeSolveParams {
    /** The learner. */
    readonly learnerId: string
    /** The problem slug. */
    readonly slug: string
    /** The language. */
    readonly language: string
    /** The source code. */
    readonly source: string
}

/** The pieces of a streak action the practice capability emits after a graded attempt. */
export interface PracticeStreakAction {
    /** The learner. */
    readonly learnerId: string
    /** The shard that counts toward the streak. */
    readonly shard: "practice"
    /** The action. */
    readonly action: "graded-attempt"
    /** The stable id of the stored attempt, so a repeat counts once. */
    readonly actionId: string
    /** Where the action lives in practice, for the streak record. */
    readonly sourceRef: string
    /** When it happened. */
    readonly at: Date
}
