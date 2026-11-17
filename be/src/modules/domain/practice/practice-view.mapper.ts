import { patternTitleOf } from "./practice-catalog.policy"
import {
    PRACTICE_LANGUAGES,
    type PracticeDifficulty,
    type PracticeHintText,
    type PracticeLanguage,
    type PracticeLocale,
    type PracticeProblemItemView,
    type PracticeProblemView,
    type PracticeStatus,
    type PracticeSubmissionView,
    type PracticeVerdict,
} from "./practice.contracts"
import type { ProblemListRow, ProblemRow, StatusRow, SubmissionRow } from "./persistence/practice.rows"

const difficultyOf = (value: string): PracticeDifficulty => (value === "easy" || value === "hard" ? value : "medium")

/** The standing a row names; anything unknown is unsolved. */
export const statusOf = (value: string | undefined): PracticeStatus =>
    value === "accepted" || value === "attempted" ? value : "unsolved"

const VERDICTS: ReadonlyArray<PracticeVerdict> = [
    "queued",
    "running",
    "accepted",
    "wrong-answer",
    "time-limit-exceeded",
    "compile-error",
    "runtime-error",
    "internal-error",
]

/** The verdict a stored name stands for; anything unknown is an internal error. */
export const toVerdict = (value: string): PracticeVerdict =>
    VERDICTS.find((verdict) => verdict === value) ?? "internal-error"

const languageOf = (value: string): PracticeLanguage =>
    PRACTICE_LANGUAGES.find((language) => language === value) ?? "python"

/** One line of a pattern list. */
export const toProblemItemView = (row: ProblemListRow): PracticeProblemItemView => ({
    slug: row.problem_id,
    title: row.title,
    difficulty: difficultyOf(row.difficulty),
    tags: row.tags,
    status: statusOf(row.status),
    solutionRevealed: row.solution_revealed,
    solutionViewedBeforeAccepted: row.solution_viewed,
    orderIndex: row.order_index,
})

/** The problem a learner opens: the statement, the starter codes, the examples and the hint steps the learner opened. */
export const toProblemView = (
    row: ProblemRow,
    locale: PracticeLocale,
    standing: StatusRow | undefined,
    revealed: ReadonlyArray<number>,
): PracticeProblemView => {
    const text = row.content[locale]
    const opened: ReadonlyArray<PracticeHintText> = text.hints.filter((hint) => revealed.includes(hint.step))
    return {
        slug: row.problem_id,
        title: text.title,
        patternId: row.pattern_id,
        patternTitle: patternTitleOf(row.pattern_id, locale),
        difficulty: difficultyOf(row.difficulty),
        tags: row.tags,
        statementMarkdown: text.statement,
        timeLimitMs: row.time_limit_ms,
        memoryLimitKb: row.memory_limit_kb,
        starterCodes: PRACTICE_LANGUAGES.map((language) => ({ language, content: row.starter_codes[language] })),
        examples: row.examples,
        hintsTotal: text.hints.length,
        hintsRevealed: opened,
        status: statusOf(standing?.status),
        solutionRevealed: standing?.solution_revealed ?? false,
        solutionViewedBeforeAccepted: standing?.solution_viewed ?? false,
        nextSlug: row.next_slug,
    }
}

/** A stored submission as the learner reads it. */
export const toSubmissionView = (row: SubmissionRow): PracticeSubmissionView => ({
    id: row.submission_id,
    slug: row.problem_id,
    language: languageOf(row.language),
    kind: row.kind === "run" ? "run" : "submit",
    verdict: toVerdict(row.verdict),
    compileOutput: row.compile_output,
    failureCode: row.failure_code,
    tests: row.tests,
    passedCount: row.passed_count,
    totalCount: row.total_count,
    timeMs: row.time_ms,
    memoryKb: row.memory_kb,
    createdAt: row.created_at,
})
