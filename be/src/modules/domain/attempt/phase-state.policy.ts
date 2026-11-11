import type { LessonOutline, LessonOutlineActivity } from "@modules/domain/lesson"
import type { PhaseProgressView } from "./attempt.contracts"
import { PHASE_ORDER } from "./attempt.mapper"
import type { LatestByActivity } from "./outcome-state.policy"

/**
 * Whether the learner finished an activity: a graded attempt, or for a diagnostic (which does not count toward passing) any
 * stored answer, so a coach that could not grade it never holds the learner back.
 */
const isFinished = (activity: LessonOutlineActivity, latest: LatestByActivity): boolean => {
    const attempt = latest.get(activity.id)
    if (attempt === undefined) return false
    return attempt.status === "graded" || activity.isDiagnostic
}

/**
 * The six phases in order, each open or done. A phase with activities is done when every one is finished. A phase with none
 * (the explain phase is reading) is done once the lesson is complete or the learner answered an activity of a later phase.
 */
export const phasesOf = (
    outline: LessonOutline,
    latest: LatestByActivity,
    isCompleted: boolean,
): Array<PhaseProgressView> =>
    PHASE_ORDER.map((phase, index) => {
        const activities = outline.activities.filter((activity) => activity.phase === phase)
        const done = activities.filter((activity) => isFinished(activity, latest)).length
        const movedOn = (): boolean =>
            outline.activities.some(
                (activity) => PHASE_ORDER.indexOf(activity.phase) > index && latest.has(activity.id),
            )
        const isDone = activities.length > 0 ? done === activities.length : isCompleted || movedOn()
        return { phase, state: isDone ? "done" : "open", done, total: activities.length }
    })
