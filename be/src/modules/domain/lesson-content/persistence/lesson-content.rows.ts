import { LessonContentError, LessonContentErrorCode } from "../errors/lesson-content.error"
import { hasIndexSections } from "../academy-manifest.mapper"
import type { ByteRange, ProtectedGrading, PublishedLesson, PublishedVariant } from "../lesson-content.contracts"

/** The JSON-safe form of one published variant: the raw body bytes travel as base64. */
interface SerializedVariant {
    readonly raw: string
    readonly index: PublishedVariant["index"]
    readonly sha256: string
}

/** The JSON-safe form of a published lesson payload, as the versions row stores it. */
interface SerializedPublished {
    readonly contentId: string
    readonly version: string
    readonly sourceHash: string
    readonly metadata: PublishedLesson["metadata"]
    readonly variants: Readonly<Record<string, SerializedVariant>>
    readonly challenges: PublishedLesson["challenges"]
}

const corrupt = (): LessonContentError => new LessonContentError({ code: LessonContentErrorCode.PayloadCorrupt })

const isObject = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null && !Array.isArray(value)

const isString = (value: unknown): value is string => typeof value === "string"

const isByte = (value: unknown): value is number =>
    typeof value === "number" && Number.isSafeInteger(value) && value >= 0

const isRange = (value: unknown): value is ByteRange =>
    isObject(value) && isByte(value.start) && isByte(value.end) && value.start <= value.end

const isIndex = (value: unknown): value is PublishedVariant["index"] =>
    isObject(value) && isRange(value.article) && isRange(value.section1) && hasIndexSections(value)

const isVariant = (value: unknown): value is SerializedVariant =>
    isObject(value) && isString(value.raw) && isString(value.sha256) && isIndex(value.index)

const isSerializedPublished = (value: unknown): value is SerializedPublished =>
    isObject(value) &&
    isString(value.contentId) &&
    isString(value.version) &&
    isString(value.sourceHash) &&
    isObject(value.metadata) &&
    isObject(value.variants) &&
    Object.values(value.variants).every(isVariant) &&
    Array.isArray(value.challenges)

const isProtectedGrading = (value: unknown): value is ProtectedGrading =>
    isObject(value) &&
    isString(value.contentId) &&
    isString(value.version) &&
    isObject(value.interviews) &&
    Object.values(value.interviews).every(
        (items) =>
            Array.isArray(items) &&
            items.every(
                (item) =>
                    isObject(item) &&
                    isString(item.itemId) &&
                    isString(item.interviewerPoints) &&
                    isString(item.sampleAnswer),
            ),
    ) &&
    isObject(value.challenges)

/** The payload a versions row carries: the published lesson with its raw bytes base64-encoded. */
export const toVersionPayload = (lesson: PublishedLesson): string => {
    const variants: Record<string, SerializedVariant> = {}
    for (const [key, variant] of Object.entries(lesson.variants)) {
        variants[key] = {
            raw: Buffer.from(variant.raw.buffer, variant.raw.byteOffset, variant.raw.byteLength).toString("base64"),
            index: variant.index,
            sha256: variant.sha256,
        }
    }
    return JSON.stringify({
        contentId: lesson.contentId,
        version: lesson.version,
        sourceHash: lesson.sourceHash,
        metadata: lesson.metadata,
        variants,
        challenges: lesson.challenges,
    })
}

/** The published lesson of a stored payload; a row that does not carry the written shape is corrupt. */
export const toPublishedLesson = (payload: unknown): PublishedLesson => {
    if (!isSerializedPublished(payload)) throw corrupt()
    const variants: Record<string, PublishedVariant> = {}
    for (const [key, variant] of Object.entries(payload.variants)) {
        variants[key] = { raw: Buffer.from(variant.raw, "base64"), index: variant.index, sha256: variant.sha256 }
    }
    return {
        contentId: payload.contentId,
        version: payload.version,
        sourceHash: payload.sourceHash,
        metadata: payload.metadata,
        variants,
        challenges: payload.challenges,
    }
}

/** The payload a grading row carries: the protected grading serialized as-is. */
export const toGradingPayload = (grading: ProtectedGrading): string => JSON.stringify(grading)

/** The protected grading of a stored payload; a row that does not carry the written shape is corrupt. */
export const toProtectedGrading = (payload: unknown): ProtectedGrading => {
    if (!isProtectedGrading(payload)) throw corrupt()
    return payload
}
