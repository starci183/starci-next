import type { LessonLocale, LessonLocaleDocument } from "./lesson.contracts"
import { premiumMarkOf } from "./lesson-access.policy"
import type { LessonServerActivity } from "./lesson-read.contracts"
import { findEssentialActivity } from "./lesson-essential.policy"

/**
 * Finds one activity of a stored locale by id, in its sections first, among the retrieval activities after and among the four-part questions last, and answers it
 * whole with the phase it belongs to; null when the lesson holds no such activity.
 */
export const findActivity = (
    document: LessonLocaleDocument,
    activityId: string,
    locale: LessonLocale = "vi",
): LessonServerActivity | null => {
    for (const section of document.sections) {
        const found = section.activities?.find((activity) => activity.id === activityId)
        if (found) return { activity: found, phase: section.phase, isPremium: premiumMarkOf(section, document) }
    }
    const retrieval = document.retrieval.find((activity) => activity.id === activityId)
    if (retrieval) return { activity: retrieval, phase: "retrieval", isPremium: premiumMarkOf(null, document) }
    return findEssentialActivity(document.essential, activityId, locale)
}
