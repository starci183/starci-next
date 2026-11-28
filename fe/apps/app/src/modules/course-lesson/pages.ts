/**
 * The seven pages of a course lesson in the order the learner meets them. The static Kiến trúc page (`architecture`) stands right after the
 * setup (owner 2026-11-28: "sau trang này đến trang kiến trúc chứ không phải đơn bình thường"): the lab is up on the learner's machine, the
 * page shows how it is built and the code that runs, then the normal cases run it (lessons.md §7).
 */
export const COURSE_PAGES = ["intro", "setup", "architecture", "happy", "unhappy", "pattern", "submit"] as const

/**
 * The eighth page, the editors' read-through audit of the lesson (owner 2026-11-28). It is not one of the learner's pages: it exists only
 * where the app is built with the audit on (the dev stack, `lessonAuditEnabled`), after the seven, with no command leading to it.
 */
export const AUDIT_PAGE = "audit" as const

/** One page of a course lesson: one of the learner's seven, or the dev-only audit. */
export type CoursePage = (typeof COURSE_PAGES)[number] | typeof AUDIT_PAGE

/** The pages the header's tabs show: the seven, then the audit when it is on. */
export const coursePagesOf = (withAudit: boolean): ReadonlyArray<CoursePage> =>
    withAudit ? [...COURSE_PAGES, AUDIT_PAGE] : COURSE_PAGES

/** The page a `?page=` query names among the pages that exist; anything else (`audit` where it is off) opens the intro. */
export const pageOf = (raw: string | undefined, withAudit = false): CoursePage =>
    coursePagesOf(withAudit).find((each) => each === raw) ?? "intro"

/** The page after this one among the learner's seven; undefined after the last, and for the audit, which leads nowhere. */
export const pageAfter = (page: CoursePage): CoursePage | undefined =>
    page === AUDIT_PAGE ? undefined : COURSE_PAGES[COURSE_PAGES.indexOf(page) + 1]
