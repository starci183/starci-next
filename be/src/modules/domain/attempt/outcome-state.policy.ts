import type { LessonOutline, LessonOutlineActivity } from "@modules/domain/lesson"
import type { AttemptView, OutcomeState } from "./attempt.contracts"

/** The points of the maximum a graded answer needs in the apply and the reflect phase for an outcome to count as mastered. */
export const MASTERY_POINTS = 4

/** The maximum those points are measured against: 4 of 6. */
export const MASTERY_OF = 6

/** The phases whose graded answers decide mastery. */
const MASTERY_PHASES = ["apply", "reflect"] as const

/** The newest attempt of each activity the learner touched, by activity id. */
export type LatestByActivity = ReadonlyMap<string, AttemptView>

/** Whether the attempt is graded with at least 4 of 6 of its points. Integer arithmetic, so 4/6 itself passes. */
export const isMasteryGrade = (attempt: AttemptView | undefined): boolean => {
    const result = attempt?.status === "graded" ? attempt.result : null
    return result !== null && result.maxScore > 0 && result.score * MASTERY_OF >= result.maxScore * MASTERY_POINTS
}

const activitiesOf = (
    outline: LessonOutline,
    outcomeId: string,
    phase: (typeof MASTERY_PHASES)[number],
): Array<LessonOutlineActivity> =>
    outline.activities.filter(
        (activity) => activity.phase === phase && !activity.isDiagnostic && activity.outcomeIds.includes(outcomeId),
    )

/**
 * Where one outcome stands. It is mastered only when the apply and the reflect activities mapped to it (an activity maps to
 * an outcome through its `outcomeIds`; its criteria do not map separately) are all graded at 4 of 6 or more and both phases
 * map at least one; a phase that maps none for the outcome cannot prove it. Before mastery: not started until the learner
 * answered an activity that counts (a diagnostic does not), learning while the lesson is open, and needing review once the
 * lesson ended without mastery.
 */
export const outcomeStateOf = (
    outcomeId: string,
    outline: LessonOutline,
    latest: LatestByActivity,
    isCompleted: boolean,
): OutcomeState => {
    const mastered = MASTERY_PHASES.every((phase) => {
        const activities = activitiesOf(outline, outcomeId, phase)
        return activities.length > 0 && activities.every((activity) => isMasteryGrade(latest.get(activity.id)))
    })
    if (mastered) return "mastered"
    const started = outline.activities.some(
        (activity) => !activity.isDiagnostic && activity.outcomeIds.includes(outcomeId) && latest.has(activity.id),
    )
    if (isCompleted) return "needs-review"
    return started ? "learning" : "not-started"
}
