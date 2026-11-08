import type { LessonLocaleDocument } from "./lesson.contracts"
import type { LessonServerActivity } from "./lesson-read.contracts"

/**
 * Finds one activity of a stored locale by id, in its sections first and among the retrieval activities after, and answers it
 * whole with the phase it belongs to; null when the lesson holds no such activity.
 */
export const findActivity = (document: LessonLocaleDocument, activityId: string): LessonServerActivity | null => {
    for (const section of document.sections) {
        const found = section.activities?.find((activity) => activity.id === activityId)
        if (found) return { activity: found, phase: section.phase }
    }
    const retrieval = document.retrieval.find((activity) => activity.id === activityId)
    return retrieval ? { activity: retrieval, phase: "retrieval" } : null
}
