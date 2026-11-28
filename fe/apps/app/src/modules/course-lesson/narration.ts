import type { NarrationTerm, NarratorView } from "@starci-next/ui"
import type { CourseLessonRecord } from "./lesson"
import { localized } from "./views"

/**
 * The narration of a lesson page (lessons.md §9, owner 2026-11-28): the mentor tells it with his photo and a narrator label, the
 * interviewer's question stands apart with who asks, and the keywords the record's `terms` explains get a dotted underline and a note.
 */

/** The staticsKey of the mentor's photo (the owner's own, cropped square at 256 px): the avatar beside the narration. */
export const MENTOR_AVATAR_KEY = "art/mentor/thay.webp"

/** The words of the narration every page shares: who narrates and how the asker of a question is named. */
export type CourseNarrationWords = {
    /** The mentor: his photo and the label beside it ("Thầy StarCi"). */
    readonly narrator: NarratorView
    /** The label over a question when the record names who asks ("Chị trưởng nhóm" gives "Chị trưởng nhóm hỏi"). */
    readonly asker: (who: string) => string
    /** The label over a question when the record names no one ("Người phỏng vấn hỏi"). */
    readonly askerAnyone: string
}

/** The keywords of the narration in the reader's language; the back end already keeps the concept's own words off the pages before it is named. */
export const termsOf = (lesson: CourseLessonRecord, locale: string): ReadonlyArray<NarrationTerm> =>
    lesson.terms.map((each) => ({ term: each.term, note: localized(each.note, locale) }))

/** The label over the interviewer's questions: who the record says asks, else the generic interviewer. */
export const askerOf = (lesson: CourseLessonRecord, words: CourseNarrationWords, locale: string): string => {
    const who = lesson.hook?.asker ?? null
    return who === null ? words.askerAnyone : words.asker(localized(who, locale))
}
