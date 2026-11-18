import { PracticeError, PracticeErrorCode } from "./errors/practice.error"
import { SUBMISSIONS_PAGE_MAX } from "./practice.config"
import type { PracticeSubmissionsCursor } from "./practice.contracts"

const INSTANT_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu

/** The opaque cursor of the page that ends at a submit: its instant and id, as base64url text. */
export const encodedSubmissionsCursor = (cursor: PracticeSubmissionsCursor): string =>
    Buffer.from(`${cursor.submittedAt}|${cursor.id}`, "utf8").toString("base64url")

/** Reads a cursor a history page handed out; anything else is PRACTICE_CURSOR_INVALID. */
export const decodedSubmissionsCursor = (text: string): PracticeSubmissionsCursor => {
    const [submittedAt = "", id = "", ...rest] = Buffer.from(text, "base64url").toString("utf8").split("|")
    if (
        rest.length > 0 ||
        !INSTANT_PATTERN.test(submittedAt) ||
        Number.isNaN(Date.parse(submittedAt)) ||
        !UUID_PATTERN.test(id)
    )
        throw new PracticeError({ code: PracticeErrorCode.CursorInvalid })
    return { submittedAt, id }
}

/** The rows a history page holds: the default when none is asked, otherwise the ask within one and the maximum. */
export const submissionsPageLimit = (limit: number | null, fallback: number): number =>
    Math.min(
        Math.max(Math.trunc(limit === null || !Number.isFinite(limit) ? fallback : limit), 1),
        SUBMISSIONS_PAGE_MAX,
    )
