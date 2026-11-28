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
    /** The source of a question's Quote when the record names who asks (the record's asker as written: "Thầy StarCi · CTO nivo.vn"). */
    readonly asker: (who: string) => string
    /** The source when the record names no one: the mentor himself ("Thầy StarCi · CTO nivo.vn", owner 2026-11-28). */
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

/** A term id or name in one spelling: lower case, a dash read as a space (`idempotency-key` and `idempotency key` are one term). */
const termKeyOf = (text: string): string => text.toLowerCase().replaceAll("-", " ").trim()

/**
 * The brief of the lesson's concept, the one line under the intro's title (owner 2026-11-28: "xóa dòng này đi, khi brief về saga chứ?"):
 * the note the record gives the concept's term (the same line its hover shows), in the reader's language. Empty when the record has no
 * note for its concept: the header then draws no description, never a line about the lab instead.
 */
export const conceptBriefOf = (lesson: CourseLessonRecord, locale: string): string => {
    const concept = termKeyOf(lesson.concept)
    if (concept === "") return ""
    const found = lesson.terms.find((each) => termKeyOf(each.term) === concept)
    return found === undefined ? "" : localized(found.note, locale)
}
