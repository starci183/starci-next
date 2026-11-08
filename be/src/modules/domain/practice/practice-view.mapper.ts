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
import type { ProblemListRow, ProblemRow, SubmissionRow } from "./persistence/practice.rows"

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

const verdictOf = (value: string): PracticeVerdict => VERDICTS.find((verdict) => verdict === value) ?? "internal-error"

const languageOf = (value: string): PracticeLanguage =>
    PRACTICE_LANGUAGES.find((language) => language === value) ?? "python"

/** One line of a pattern list; the free problems of the pattern are the first ones. */
export const toProblemItemView = (row: ProblemListRow, locked: boolean): PracticeProblemItemView => ({
    slug: row.problem_id,
    title: row.title,
    difficulty: difficultyOf(row.difficulty),
    tags: row.tags,
    status: statusOf(row.status),
    locked,
    orderIndex: row.order_index,
})

/** The problem a learner opens; a locked one answers the statement and nothing a run needs. */
export const toProblemView = (
    row: ProblemRow,
    locale: PracticeLocale,
    locked: boolean,
    status: PracticeStatus,
    revealed: ReadonlyArray<number>,
): PracticeProblemView => {
    const text = row.content[locale]
    const opened: ReadonlyArray<PracticeHintText> = locked
        ? []
        : text.hints.filter((hint) => revealed.includes(hint.step))
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
        locked,
        starterCodes: locked
            ? []
            : PRACTICE_LANGUAGES.map((language) => ({ language, content: row.starter_codes[language] })),
        examples: locked ? [] : row.examples,
        hintsTotal: text.hints.length,
        hintsRevealed: opened,
        status,
        nextSlug: row.next_slug,
    }
}

/** A stored submission as the learner reads it. */
export const toSubmissionView = (row: SubmissionRow): PracticeSubmissionView => ({
    id: row.submission_id,
    slug: row.problem_id,
    language: languageOf(row.language),
    kind: row.kind === "run" ? "run" : "submit",
    verdict: verdictOf(row.verdict),
    compileOutput: row.compile_output,
    failureCode: row.failure_code,
    tests: row.tests,
    passedCount: row.passed_count,
    totalCount: row.total_count,
    timeMs: row.time_ms,
    memoryKb: row.memory_kb,
    createdAt: row.created_at,
})
