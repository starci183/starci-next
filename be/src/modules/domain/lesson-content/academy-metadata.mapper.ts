import { LessonContentError, LessonContentErrorCode } from "./errors/lesson-content.error"
import {
    leafBool,
    leafInt,
    leafText,
    leafTextOrNull,
    parseAcademyDocument,
    unknownNames,
} from "./academy-document.mapper"
import type { LessonMetadata } from "./lesson-content.contracts"

const METADATA_FIELDS = ["sortIndex", "title", "description", "minutesRead", "isPremium", "verified"]

/**
 * Parses one locale metadata document: a flat leaf map whose `verified` stamp may be absent. Any field outside the
 * recorded shape fails closed.
 */
export const parseLessonMetadata = (raw: Uint8Array): LessonMetadata => {
    const roots = parseAcademyDocument(raw)
    const unknown = unknownNames(roots, METADATA_FIELDS)
    if (unknown.length > 0) {
        throw new LessonContentError({
            code: LessonContentErrorCode.ClassificationUnknown,
            params: { reason: `unknown metadata fields: ${unknown.join(",")}` },
        })
    }
    leafInt(raw, roots, "sortIndex")
    const minutesRead = leafInt(raw, roots, "minutesRead")
    if (minutesRead <= 0) {
        throw new LessonContentError({
            code: LessonContentErrorCode.SourceMalformed,
            params: { reason: "expected a positive minutesRead", line: 0 },
        })
    }
    return {
        title: leafText(raw, roots, "title"),
        description: leafText(raw, roots, "description"),
        minutesRead,
        isPremium: leafBool(raw, roots, "isPremium"),
        verifiedAt: leafTextOrNull(raw, roots, "verified"),
    }
}
