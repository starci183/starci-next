import type { ReviewGrade, ReviewStatus } from "./review.contracts"

/** The days between reviews, one per ladder step. */
export const REVIEW_LADDER: ReadonlyArray<number> = [1, 3, 7, 14, 30, 60, 120, 180]

/** The step of an item never reviewed. */
export const NEW_STEP = -1

/** The first step that counts as a review rather than learning. */
const REVIEW_FROM_STEP = 2

/** The days after which a weak retrieval answer is asked once more. */
export const RETRIEVAL_RETRY_DAYS = 3

/** Where a flashcard stands before a grade. */
export interface SchedulerState {
    /** The ladder step, or NEW_STEP before the first review. */
    readonly step: number
}

/** What a grade does to a flashcard. */
export interface ScheduleResult {
    /** The new ladder step. */
    readonly step: number
    /** The new status. */
    readonly status: ReviewStatus
    /** The days until it is due again; 0 means it returns at the end of the session of today. */
    readonly intervalDays: number
}

/** The days until the next review for each of the four grades. */
export type ScheduleIntervals = Readonly<Record<ReviewGrade, number>>

/** What a grade does to a retrieval item. */
export interface RetrievalSchedule {
    /** The new status: done, or learning for one more attempt. */
    readonly status: ReviewStatus
    /** The days until the extra attempt; 0 when the item is closed. */
    readonly intervalDays: number
}

/** The one interface the next review is computed behind, so another algorithm can replace the ladder. */
export interface ReviewScheduler {
    /** The next state of a flashcard after a grade. */
    schedule(state: SchedulerState, grade: ReviewGrade): ScheduleResult
    /** The days each grade would give, for the buttons. */
    preview(state: SchedulerState): ScheduleIntervals
    /** The next state of a retrieval item after a grade; good and easy close it, the others ask once more after 3 days. */
    scheduleRetrieval(grade: ReviewGrade): RetrievalSchedule
}

const clamp = (step: number): number => Math.min(Math.max(step, 0), REVIEW_LADDER.length - 1)

const daysAt = (step: number): number =>
    REVIEW_LADDER.reduce((days, value, index) => (index === step ? value : days), 1)

const statusOf = (step: number): ReviewStatus => (step >= REVIEW_FROM_STEP ? "review" : "learning")

/** How many steps up a grade that does not reset the item moves it. */
const stepsUp = (grade: ReviewGrade): number => {
    if (grade === "hard") return 0
    if (grade === "good") return 1
    return 2
}

/** Again goes back to step 0 and returns today; hard stays; good moves one step up; easy moves two. */
const schedule = (state: SchedulerState, grade: ReviewGrade): ScheduleResult => {
    if (grade === "again") return { step: 0, status: "learning", intervalDays: 0 }
    const step = clamp(state.step + stepsUp(grade))
    return { step, status: statusOf(step), intervalDays: daysAt(step) }
}

/** The fixed ladder of the MVP. */
export const ladderScheduler: ReviewScheduler = {
    schedule,
    preview: (state) => ({
        again: schedule(state, "again").intervalDays,
        hard: schedule(state, "hard").intervalDays,
        good: schedule(state, "good").intervalDays,
        easy: schedule(state, "easy").intervalDays,
    }),
    scheduleRetrieval: (grade) =>
        grade === "good" || grade === "easy"
            ? { status: "done", intervalDays: 0 }
            : { status: "learning", intervalDays: RETRIEVAL_RETRY_DAYS },
}
