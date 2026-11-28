/**
 * The seven pages of a course lesson in the order the learner meets them. The static Kiến trúc page (`architecture`) stands right after the
 * setup (owner 2026-11-28: "sau trang này đến trang kiến trúc chứ không phải đơn bình thường"): the lab is up on the learner's machine, the
 * page shows how it is built and the code that runs, then the normal cases run it (lessons.md §7).
 */
export const COURSE_PAGES = ["intro", "setup", "architecture", "happy", "unhappy", "pattern", "submit"] as const

/** One page of a course lesson. */
export type CoursePage = (typeof COURSE_PAGES)[number]

/** The page a `?page=` query names; anything else opens the intro. */
export const pageOf = (raw: string | undefined): CoursePage => COURSE_PAGES.find((each) => each === raw) ?? "intro"

/** The page after this one; undefined after the last. */
export const pageAfter = (page: CoursePage): CoursePage | undefined => COURSE_PAGES[COURSE_PAGES.indexOf(page) + 1]
