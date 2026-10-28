import { LessonContentError, LessonContentErrorCode } from "./errors/lesson-content.error"
import type { ProtectedKind } from "./lesson-content.contracts"

const HEX_64 = /^[0-9a-f]{64}$/
const CONTENT_ID = /^fixture\.lessons\.([a-z0-9-]+)\.v\d+$/
const PROTECTED_KINDS: ReadonlySet<string> = new Set(["interviewerPoints", "sampleAnswer"])

/** A byte range of the manifest: zero-based, end exclusive. */
export interface ManifestRange {
    /** The start of this ManifestRange. */
    readonly start: number
    /** The end of this ManifestRange. */
    readonly end: number
}

/** A byte range of the manifest with the SHA-256 of its slice. */
export interface ManifestHashedRange extends ManifestRange {
    /** The sha256 of this ManifestHashedRange. */
    readonly sha256: string
}

/** A withheld byte range of the manifest with its classification. */
export interface ManifestProtectedRange extends ManifestRange {
    /** The kind of this ManifestProtectedRange. */
    readonly kind: ProtectedKind
}

/** One heading entry of the manifest outline. */
export interface ManifestOutlineEntry extends ManifestRange {
    /** The id of this ManifestOutlineEntry. */
    readonly id: string
    /** The depth of this ManifestOutlineEntry. */
    readonly depth: number
    /** The text of this ManifestOutlineEntry. */
    readonly text: string
}

/** One interview question of the manifest: the public prompt span and its protected child spans. */
export interface ManifestInterviewQuestion {
    /** The id of this ManifestInterviewQuestion. */
    readonly id: string
    /** The prompt start of this ManifestInterviewQuestion. */
    readonly promptStart: number
    /** The prompt end of this ManifestInterviewQuestion. */
    readonly promptEnd: number
    /** The protected ranges of this ManifestInterviewQuestion. */
    readonly protectedRanges: ReadonlyArray<ManifestProtectedRange>
}

/** The byte index of one article body the manifest records for a programming-language and locale pair. */
export interface ManifestArticle {
    /** The programming language of this ManifestArticle. */
    readonly programmingLanguage: string
    /** The locale of this ManifestArticle. */
    readonly locale: string
    /** The fixture path of this ManifestArticle. */
    readonly fixturePath: string
    /** The article of this ManifestArticle. */
    readonly article: ManifestHashedRange
    /** The section1 of this ManifestArticle. */
    readonly section1: ManifestHashedRange
    /** The outline of this ManifestArticle. */
    readonly outline: ReadonlyArray<ManifestOutlineEntry>
    /** The protected ranges of this ManifestArticle. */
    readonly protectedRanges: ReadonlyArray<ManifestProtectedRange>
    /** The interview questions of this ManifestArticle. */
    readonly interviewQuestions: ReadonlyArray<ManifestInterviewQuestion>
    /** The public article ranges of this ManifestArticle. */
    readonly publicArticleRanges: ReadonlyArray<ManifestRange>
}

/** One original file of the manifest with its expected byte count and SHA-256. */
export interface ManifestFile {
    /** The source path of this ManifestFile. */
    readonly sourcePath: string
    /** The fixture path of this ManifestFile. */
    readonly fixturePath: string
    /** The bytes of this ManifestFile. */
    readonly bytes: number
    /** The sha256 of this ManifestFile. */
    readonly sha256: string
}

/** The versioned machine input of an Academy snapshot, validated field by field. */
export interface FixtureManifest {
    /** The id of this FixtureManifest. */
    readonly id: string
    /** The content id of this FixtureManifest. */
    readonly contentId: string
    /** The version of this FixtureManifest. */
    readonly version: string
    /** The locales of this FixtureManifest. */
    readonly locales: ReadonlyArray<string>
    /** The programming languages of this FixtureManifest. */
    readonly programmingLanguages: ReadonlyArray<string>
    /** The files of this FixtureManifest. */
    readonly files: ReadonlyArray<ManifestFile>
    /** The articles of this FixtureManifest. */
    readonly articles: ReadonlyArray<ManifestArticle>
}

const invalid = (field: string): LessonContentError =>
    new LessonContentError({ code: LessonContentErrorCode.ManifestInvalid, params: { field } })

const isObject = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null && !Array.isArray(value)

const isString = (value: unknown): value is string => typeof value === "string" && value.length > 0

const isByte = (value: unknown): value is number =>
    typeof value === "number" && Number.isSafeInteger(value) && value >= 0

const isHash = (value: unknown): value is string => isString(value) && HEX_64.test(value)

const isRange = (value: unknown): value is ManifestRange => {
    if (!isObject(value) || !isByte(value.start) || !isByte(value.end)) return false
    return value.start <= value.end
}

const isHashedRange = (value: unknown): value is ManifestHashedRange =>
    isRange(value) && isObject(value) && isHash(value.sha256)

const isProtectedRange = (value: unknown): value is ManifestProtectedRange =>
    isRange(value) && isObject(value) && isString(value.kind) && PROTECTED_KINDS.has(value.kind)

const isOutlineEntry = (value: unknown): value is ManifestOutlineEntry =>
    isRange(value) && isObject(value) && isString(value.id) && isByte(value.depth) && isString(value.text)

const isInterviewQuestion = (value: unknown): value is ManifestInterviewQuestion =>
    isObject(value) &&
    isString(value.id) &&
    isByte(value.promptStart) &&
    isByte(value.promptEnd) &&
    Array.isArray(value.protectedRanges) &&
    value.protectedRanges.every(isProtectedRange)

const isManifestFile = (value: unknown): value is ManifestFile =>
    isObject(value) &&
    isString(value.sourcePath) &&
    isString(value.fixturePath) &&
    isByte(value.bytes) &&
    isHash(value.sha256)

/**
 * The recorded index sections of an article-like record: outline, protected ranges, interview questions and public
 * ranges. The manifest guard and the stored-payload guard share this shape; each caller adds its own article and
 * section-1 checks.
 */
export const hasIndexSections = (value: unknown): boolean =>
    isObject(value) &&
    Array.isArray(value.outline) &&
    value.outline.every(isOutlineEntry) &&
    Array.isArray(value.protectedRanges) &&
    value.protectedRanges.every(isProtectedRange) &&
    Array.isArray(value.interviewQuestions) &&
    value.interviewQuestions.every(isInterviewQuestion) &&
    Array.isArray(value.publicArticleRanges) &&
    value.publicArticleRanges.every(isRange)

const isManifestArticle = (value: unknown): value is ManifestArticle =>
    isObject(value) &&
    isString(value.programmingLanguage) &&
    isString(value.locale) &&
    isString(value.fixturePath) &&
    isHashedRange(value.article) &&
    isHashedRange(value.section1) &&
    hasIndexSections(value)

const isStringList = (value: unknown): value is Array<string> => Array.isArray(value) && value.every(isString)

/**
 * Parses the fixture manifest text into the typed machine input. Every field type is checked before a single source
 * byte is read; anything off the recorded shape fails closed as an invalid manifest.
 */
export const parseFixtureManifest = (text: string): FixtureManifest => {
    let parsed: unknown
    try {
        parsed = JSON.parse(text)
    } catch (error) {
        throw new LessonContentError({
            code: LessonContentErrorCode.ManifestInvalid,
            params: { field: "manifest.json" },
            cause: error,
        })
    }
    if (!isObject(parsed)) throw invalid("root")
    if (parsed.schema !== "lessons.fixture-provenance@1") throw invalid("schema")
    if (!isString(parsed.id)) throw invalid("id")
    const contentId = CONTENT_ID.exec(parsed.id)?.[1]
    if (contentId === undefined) throw invalid("id")
    if (!isString(parsed.version)) throw invalid("version")
    if (!isStringList(parsed.locales) || parsed.locales.length === 0) throw invalid("locales")
    if (!isStringList(parsed.programmingLanguages) || parsed.programmingLanguages.length === 0)
        throw invalid("programmingLanguages")
    if (!Array.isArray(parsed.files) || !parsed.files.every(isManifestFile)) throw invalid("files")
    if (!Array.isArray(parsed.articles) || !parsed.articles.every(isManifestArticle)) throw invalid("articles")
    return {
        id: parsed.id,
        contentId,
        version: parsed.version,
        locales: parsed.locales,
        programmingLanguages: parsed.programmingLanguages,
        files: parsed.files,
        articles: parsed.articles,
    }
}
