/** The six pages of a course lesson in the order the learner meets them. */
export const COURSE_PAGES = ["intro", "setup", "happy", "unhappy", "pattern", "submit"] as const

/** One page of a course lesson. */
export type CoursePage = (typeof COURSE_PAGES)[number]

/** The page a `?page=` query names; anything else opens the intro. */
export const pageOf = (raw: string | undefined): CoursePage => COURSE_PAGES.find((each) => each === raw) ?? "intro"

/** The page after this one; undefined after the last. */
export const pageAfter = (page: CoursePage): CoursePage | undefined => COURSE_PAGES[COURSE_PAGES.indexOf(page) + 1]
