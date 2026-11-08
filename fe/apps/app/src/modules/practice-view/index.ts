import type {
    PracticeProblemQuery,
    PracticeProblemsQuery,
    PracticeSubmissionQuery,
    RunPracticeMutation,
    SubmitPracticeMutation,
} from "@/modules/api"
import {
    PRACTICE_LANGUAGES,
    type PracticeLanguageId,
    type PracticeOutcome,
    type PracticeProblemItemView,
    type PracticeProblemView,
    type PracticeProgress,
    type PracticeSubmissionView,
} from "@/modules/types"

/** The outcomes the judge reports; anything else is a contract break and stops here. */
const OUTCOMES: ReadonlyArray<PracticeOutcome> = [
    "QUEUED",
    "RUNNING",
    "ACCEPTED",
    "WRONG_ANSWER",
    "TIME_LIMIT_EXCEEDED",
    "COMPILE_ERROR",
    "RUNTIME_ERROR",
    "INTERNAL_ERROR",
]

/** The progress states of a problem; anything else is a contract break and stops here. */
const PROGRESSES: ReadonlyArray<PracticeProgress> = ["UNSOLVED", "ATTEMPTED", "ACCEPTED"]

/** The language of the answer: one of the five the judge runs. */
const languageOf = (raw: string): PracticeLanguageId => {
    const language = PRACTICE_LANGUAGES.find((each) => each === raw)
    if (language === undefined) throw new Error(`unknown practice language ${raw}`)
    return language
}

/** The verdict of the answer: one the judge reports. */
const outcomeOf = (raw: string): PracticeOutcome => {
    const outcome = OUTCOMES.find((each) => each === raw)
    if (outcome === undefined) throw new Error(`unknown practice verdict ${raw}`)
    return outcome
}

/** The progress of the answer: one a problem can be in. */
const progressOf = (raw: string): PracticeProgress => {
    const progress = PROGRESSES.find((each) => each === raw)
    if (progress === undefined) throw new Error(`unknown practice progress ${raw}`)
    return progress
}

/** The kind of a submission: a run on the examples or a submit against every test. */
const kindOf = (raw: string): PracticeSubmissionView["kind"] => {
    if (raw === "RUN" || raw === "SUBMIT") return raw
    throw new Error(`unknown practice submission kind ${raw}`)
}

/** A run or a submission as any of the three doors answers it. */
type SubmissionWire =
    | RunPracticeMutation["runPractice"]
    | SubmitPracticeMutation["submitPractice"]
    | PracticeSubmissionQuery["practiceSubmission"]

/** The run or submission of the answer, with its unions narrowed. */
export const practiceSubmissionOf = (wire: SubmissionWire): PracticeSubmissionView => ({
    ...wire,
    language: languageOf(wire.language),
    kind: kindOf(wire.kind),
    verdict: outcomeOf(wire.verdict),
})

/** The problem rows of a pattern, with the learner's progress narrowed. */
export const practiceProblemItemsOf = (wire: PracticeProblemsQuery): ReadonlyArray<PracticeProblemItemView> =>
    wire.practiceProblems.map((item) => ({ ...item, status: progressOf(item.status) }))

/** The problem of the answer, with its starter languages and progress narrowed. */
export const practiceProblemOf = (wire: PracticeProblemQuery): PracticeProblemView => ({
    ...wire.practiceProblem,
    status: progressOf(wire.practiceProblem.status),
    starterCodes: wire.practiceProblem.starterCodes.map((starter) => ({
        language: languageOf(starter.language),
        content: starter.content,
    })),
})
