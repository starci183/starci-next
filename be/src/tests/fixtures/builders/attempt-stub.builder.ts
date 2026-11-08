import type { FakeTransaction } from "@starci/jest-preset"
import type { LessonActivity, LessonContentService, LessonPhase } from "@modules/domain/lesson"
import { choiceActivityOf, explainActivityOf } from "./lesson.builder"
import { LEARNER, resultOf, writtenRowOf } from "./attempt.builder"

const NOW = new Date("2026-11-08T10:00:00.000Z")

/** The activity the lesson content port answers, as the attempt service reads it. */
type FoundActivity = Awaited<ReturnType<LessonContentService["activity"]>>

/** One scripted answer of the fake entity manager: the statement and the rows it returns. */
export type QueryStub = readonly [string, unknown]

/** An activity found in a phase, as the lesson content port answers it. */
export const foundOf = (activity: LessonActivity, phase: LessonPhase | "retrieval"): FoundActivity => ({
    activity,
    phase,
})

/** The parameters of one recorded query call, or none when the call carried no list. */
const paramsOf = (call: ReadonlyArray<unknown>): ReadonlyArray<unknown> => {
    const [, params] = call
    return Array.isArray(params) ? params : []
}

/** The parameter lists of every call that ran `statement`, in order. */
export const callsOf = (tx: FakeTransaction, statement: string): Array<ReadonlyArray<unknown>> =>
    tx.em.query.mock.calls.filter((call) => call[0] === statement).map((call) => paramsOf(call))

/** The demo choice activity found in its predict phase. */
export const choiceFound: FoundActivity = foundOf(choiceActivityOf("vi"), "predict")

/** The demo explain activity found in its challenge phase. */
export const explainFound: FoundActivity = foundOf(explainActivityOf("vi"), "challenge")

/** A written answer row stored graded as a diagnostic. */
export const gradedWritten: ReturnType<typeof writtenRowOf> = writtenRowOf({
    status: "graded",
    result: resultOf({ isDiagnostic: true }),
    graded_at: NOW,
})

/** The parameters of one outcome upsert of the demo lesson at the demo instant. */
export const upsert = (outcomes: Array<string>, understood: number, proved: number): ReadonlyArray<unknown> => [
    LEARNER,
    "demo-lesson",
    outcomes,
    understood,
    proved,
    NOW,
]
