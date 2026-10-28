import { Injectable } from "@nestjs/common"
import type { EntityManager } from "typeorm"
import { InjectClock } from "@modules/platform/clock"
import type { Clock } from "@modules/platform/clock"
import { InjectLogger } from "@modules/platform/logging"
import type { Logger } from "@modules/platform/logging"
import { InjectPrimaryEntityManager } from "@modules/platform/database"
import { LessonContentError, LessonContentErrorCode } from "./errors/lesson-content.error"
import { LessonContentLogEvent } from "./lesson-content.log-events"
import { readAcademySource } from "./academy-source.client"
import type { AcademySource } from "./academy-source.client"
import { deriveArticleIndex, indexMismatchField, interviewGradingOf } from "./academy-article.mapper"
import { parseChallengeDefinition, parseChallengeSubmission } from "./academy-challenge.mapper"
import { parseLessonMetadata } from "./academy-metadata.mapper"
import { sha256Hex, textOf } from "./academy-document.mapper"
import { projectPublicLesson } from "./lesson-content.projection"
import { LessonContentGradingEntity, LessonContentVersionEntity } from "./persistence/entities/lesson-content.entity"
import {
    toGradingPayload,
    toPublishedLesson,
    toProtectedGrading,
    toVersionPayload,
} from "./persistence/lesson-content.rows"
import { INSERT_LESSON_GRADING, INSERT_LESSON_VERSION } from "./persistence/lesson-content.sql"
import type {
    ChallengeGrading,
    ChallengeSubmissionGrading,
    ImportLessonsParams,
    ImportReport,
    InterviewGrading,
    InterviewReveal,
    LessonLocale,
    LessonMetadata,
    ParsedChallengeDefinition,
    ProgrammingLanguage,
    ProtectedGrading,
    PublicLesson,
    PublishedChallenge,
    PublishedLesson,
    PublishedVariant,
    ReadLessonParams,
    RevealInterviewParams,
} from "./lesson-content.contracts"
import {
    challengeKey,
    DEFAULT_LESSON_FIXTURE,
    LESSON_LOCALES,
    PROGRAMMING_LANGUAGES,
    variantKey,
} from "./lesson-content.contracts"

const METADATA_PATH = /^original\/([a-z]{2})\.md$/
const CHALLENGE_DEFINITION_PATH = /^original\/challenges\/([^/]+)\/([a-z]{2})\.md$/
const CHALLENGE_SUBMISSION_PATH = /^original\/challenges\/([^/]+)\/submissions\/0\/([a-z]{2})\.md$/

const invalid = (field: string): LessonContentError =>
    new LessonContentError({ code: LessonContentErrorCode.ManifestInvalid, params: { field } })

const mismatch = (field: string): LessonContentError =>
    new LessonContentError({ code: LessonContentErrorCode.SourceMismatch, params: { field } })

const malformed = (reason: string): LessonContentError =>
    new LessonContentError({ code: LessonContentErrorCode.SourceMalformed, params: { reason, line: 0 } })

/** The locale a manifest or file name declares; an axis outside the ones this importer reads is invalid input. */
const localeOf = (text: string): LessonLocale => {
    const locale = LESSON_LOCALES.find((known) => known === text)
    if (locale === undefined) throw invalid("locales")
    return locale
}

/** The programming language a manifest or file name declares; an unknown axis is invalid input. */
const languageOf = (text: string): ProgrammingLanguage => {
    const language = PROGRAMMING_LANGUAGES.find((known) => known === text)
    if (language === undefined) throw invalid("programmingLanguages")
    return language
}

/** The bytes of one recorded fixture path; a file the manifest indexes but does not list is a source defect. */
const fileOf = (source: AcademySource, fixturePath: string): Uint8Array => {
    const raw = source.files.get(fixturePath)
    if (raw === undefined) throw mismatch(fixturePath)
    return raw
}

/** One value of a per-locale record after every declared locale was required; a gap means the source lied. */
const requireLocale = <T>(byLocale: Partial<Record<LessonLocale, T>>, locale: LessonLocale, where: string): T => {
    const value = byLocale[locale]
    if (value === undefined) throw mismatch(`${where}`)
    return value
}

/** What the parse stage produces: the immutable published version plus its separate server-only grading. */
interface ParsedImport {
    readonly lesson: PublishedLesson
    readonly grading: ProtectedGrading
}

/** One challenge definition or submission remembered under its challenge id and display locale. */
const rememberByLocale = (
    byChallenge: Map<string, Map<LessonLocale, Uint8Array>>,
    match: RegExpExecArray,
    raw: Uint8Array,
): void => {
    const challengeId = String(match[1])
    const byLocale = byChallenge.get(challengeId) ?? new Map<LessonLocale, Uint8Array>()
    byLocale.set(localeOf(String(match[2])), raw)
    byChallenge.set(challengeId, byLocale)
}

/** The non-article files of the source, classified by their path: locale metadata, definitions and submissions. */
interface ClassifiedFiles {
    readonly metadata: Partial<Record<LessonLocale, LessonMetadata>>
    readonly definitions: Map<string, Map<LessonLocale, Uint8Array>>
    readonly submissions: Map<string, Map<LessonLocale, Uint8Array>>
}

/** The article variants of the source and the protected interview grading their questions carry. */
interface ParsedVariants {
    readonly variants: Record<string, PublishedVariant>
    readonly interviews: Record<string, Array<InterviewGrading>>
}

/** One parsed challenge submission and its raw bytes, kept for hashing and storage. */
interface ParsedChallengeSubmission {
    readonly grading: ChallengeSubmissionGrading
    readonly raw: Uint8Array
}

/** The parsed definition and submission of one challenge in every declared locale. */
interface ChallengeLocaleParts {
    readonly order: number
    readonly defsByLocale: Partial<Record<LessonLocale, ParsedChallengeDefinition>>
    readonly subsByLocale: Partial<Record<LessonLocale, ParsedChallengeSubmission>>
}

/** The challenges of the source and the protected grading their submissions carry. */
interface ParsedChallenges {
    readonly challenges: Array<PublishedChallenge>
    readonly grading: Record<string, ChallengeGrading>
}

/** The non-article files of the source, classified by their path: locale metadata, definitions and submissions. */
const classifyFiles = (source: AcademySource, locales: ReadonlyArray<LessonLocale>): ClassifiedFiles => {
    const articlePaths = new Set(source.manifest.articles.map((article) => article.fixturePath))
    const metadata: Partial<Record<LessonLocale, LessonMetadata>> = {}
    const definitions = new Map<string, Map<LessonLocale, Uint8Array>>()
    const submissions = new Map<string, Map<LessonLocale, Uint8Array>>()
    for (const [path, raw] of source.files) {
        if (articlePaths.has(path)) continue
        const meta = METADATA_PATH.exec(path)
        if (meta !== null) {
            metadata[localeOf(String(meta[1]))] = parseLessonMetadata(raw)
            continue
        }
        const definition = CHALLENGE_DEFINITION_PATH.exec(path)
        if (definition !== null) {
            rememberByLocale(definitions, definition, raw)
            continue
        }
        const submission = CHALLENGE_SUBMISSION_PATH.exec(path)
        if (submission !== null) {
            rememberByLocale(submissions, submission, raw)
            continue
        }
        throw invalid("files")
    }
    for (const locale of locales) {
        if (metadata[locale] === undefined) throw mismatch(`original/${locale}.md`)
    }
    return { metadata, definitions, submissions }
}

/** The article variants of the source: every recorded entry derives its index and matches it exactly. */
const parseVariants = (
    source: AcademySource,
    locales: ReadonlyArray<LessonLocale>,
    languages: ReadonlyArray<ProgrammingLanguage>,
): ParsedVariants => {
    const { manifest } = source
    if (manifest.articles.length !== locales.length * languages.length) throw invalid("articles")
    const variants: Record<string, PublishedVariant> = {}
    const interviews: Record<string, Array<InterviewGrading>> = {}
    const seen = new Set<string>()
    for (const recorded of manifest.articles) {
        const language = languageOf(recorded.programmingLanguage)
        const locale = localeOf(recorded.locale)
        const key = variantKey(language, locale)
        if (seen.has(key)) throw invalid("articles")
        seen.add(key)
        const raw = fileOf(source, recorded.fixturePath)
        const index = deriveArticleIndex(raw, language)
        const field = indexMismatchField(raw, index, recorded)
        if (field !== null) {
            throw new LessonContentError({
                code: LessonContentErrorCode.IndexMismatch,
                params: { field, path: recorded.fixturePath },
            })
        }
        variants[key] = { raw, index, sha256: sha256Hex(raw) }
        interviews[key] = interviewGradingOf(raw, index.interviewQuestions)
    }
    return { variants, interviews }
}

/** Parses the definition and submission of one challenge in every declared locale and checks the order agrees. */
const challengePartsOf = (
    id: string,
    defs: Map<LessonLocale, Uint8Array>,
    subs: Map<LessonLocale, Uint8Array>,
    locales: ReadonlyArray<LessonLocale>,
): ChallengeLocaleParts => {
    let order = -1
    const defsByLocale: ChallengeLocaleParts["defsByLocale"] = {}
    const subsByLocale: ChallengeLocaleParts["subsByLocale"] = {}
    for (const locale of locales) {
        const definitionRaw = defs.get(locale)
        if (definitionRaw !== undefined) {
            const parsed = parseChallengeDefinition(definitionRaw)
            if (order === -1) {
                order = parsed.order
            } else if (parsed.order !== order) {
                throw malformed(`the sortIndex of challenge ${id} differs by locale`)
            }
            defsByLocale[locale] = parsed
        }
        const submissionRaw = subs.get(locale)
        if (submissionRaw !== undefined) {
            subsByLocale[locale] = { grading: parseChallengeSubmission(submissionRaw), raw: submissionRaw }
        }
    }
    return { order, defsByLocale, subsByLocale }
}

/** Publishes one challenge: complete definitions per locale and the protected grading each submission carries. */
const publishedChallengeOf = (
    id: string,
    order: number,
    parts: ChallengeLocaleParts,
    locales: ReadonlyArray<LessonLocale>,
    grading: Record<string, ChallengeGrading>,
): PublishedChallenge => {
    const byLocale: Partial<Record<LessonLocale, PublishedChallenge["definitions"][LessonLocale]>> = {}
    for (const locale of locales) {
        const parsed = requireLocale(parts.defsByLocale, locale, `original/challenges/${id}/${locale}.md`)
        const submission = requireLocale(
            parts.subsByLocale,
            locale,
            `original/challenges/${id}/submissions/0/${locale}.md`,
        )
        byLocale[locale] = parsed.definition
        grading[challengeKey(id, locale)] = {
            ...parsed.grading,
            ...submission.grading,
            sha256: sha256Hex(submission.raw),
            raw: textOf(submission.raw, { start: 0, end: submission.raw.byteLength }),
        }
    }
    return { id, order, definitions: { en: requireLocale(byLocale, "en", id), vi: requireLocale(byLocale, "vi", id) } }
}

/**
 * The challenges of the source: every definition locale must parse, its sortIndex agree across locales and its
 * protected submission sit next to it; a submission without a definition is a mismatch.
 */
const parseChallenges = (
    definitions: Map<string, Map<LessonLocale, Uint8Array>>,
    submissions: Map<string, Map<LessonLocale, Uint8Array>>,
    locales: ReadonlyArray<LessonLocale>,
): ParsedChallenges => {
    const challenges: Array<PublishedChallenge> = []
    const challengeGrading: Record<string, ChallengeGrading> = {}
    for (const [id, defs] of [...definitions.entries()].sort(([left], [right]) => left.localeCompare(right))) {
        const subs = submissions.get(id)
        if (subs === undefined) throw mismatch(`original/challenges/${id}/submissions/0`)
        const parts = challengePartsOf(id, defs, subs, locales)
        challenges.push(publishedChallengeOf(id, parts.order, parts, locales, challengeGrading))
    }
    for (const id of submissions.keys()) {
        if (!definitions.has(id)) throw mismatch(`original/challenges/${id}`)
    }
    challenges.sort((left, right) => left.order - right.order)
    return { challenges, grading: challengeGrading }
}

/**
 * Parses one validated snapshot into the stored model: every variant's derived byte index is checked against the
 * index the manifest records, every file is classified into exactly one role, and every challenge is complete in
 * every declared locale. Anything outside the recorded shape fails closed before a byte is stored.
 */
const parseAcademySource = (source: AcademySource): ParsedImport => {
    const { manifest } = source
    const locales = manifest.locales.map(localeOf)
    const languages = manifest.programmingLanguages.map(languageOf)
    for (const required of LESSON_LOCALES) {
        if (!locales.includes(required)) throw invalid("locales")
    }
    for (const required of PROGRAMMING_LANGUAGES) {
        if (!languages.includes(required)) throw invalid("programmingLanguages")
    }
    const { metadata, definitions, submissions } = classifyFiles(source, locales)
    const { variants, interviews } = parseVariants(source, locales, languages)
    const { challenges, grading: challengeGrading } = parseChallenges(definitions, submissions, locales)
    return {
        lesson: {
            contentId: manifest.contentId,
            version: manifest.version,
            sourceHash: source.manifestSha256,
            metadata: {
                en: requireLocale(metadata, "en", "original/en.md"),
                vi: requireLocale(metadata, "vi", "original/vi.md"),
            },
            variants,
            challenges,
        },
        grading: { contentId: manifest.contentId, version: manifest.version, interviews, challenges: challengeGrading },
    }
}

@Injectable()
/** The lesson-content capability: imports immutable Academy versions and projects them for public reads. */
export class LessonContentService {
    constructor(
        @InjectPrimaryEntityManager() private readonly entityManager: EntityManager,
        @InjectClock() private readonly clock: Clock,
        @InjectLogger() private readonly logger: Logger,
    ) {}

    /**
     * Imports one Academy snapshot: validates the manifest and every byte hash, parses the metadata, bodies and
     * challenges, then publishes the version and its grading in one transaction. A byte-identical import is a no-op;
     * the same version with different bytes is an immutable-version conflict; a failed import leaves the previously
     * published version untouched.
     */
    async importLessons(params: ImportLessonsParams): Promise<ImportReport> {
        const source = await readAcademySource(params.fixtureDir ?? DEFAULT_LESSON_FIXTURE)
        const parsed = parseAcademySource(source)
        const { lesson, grading } = parsed
        const report = await this.entityManager.transaction(async (manager) => {
            const existing = await manager.findOne(LessonContentVersionEntity, {
                where: { contentId: lesson.contentId, version: lesson.version },
            })
            if (existing !== null) {
                if (existing.sourceHash !== lesson.sourceHash) {
                    throw new LessonContentError({
                        code: LessonContentErrorCode.VersionConflict,
                        params: { contentId: lesson.contentId, version: lesson.version },
                    })
                }
                return "unchanged" as const
            }
            const now = this.clock.now()
            await manager.query(INSERT_LESSON_VERSION, [
                lesson.contentId,
                lesson.version,
                lesson.sourceHash,
                toVersionPayload(lesson),
                now,
            ])
            await manager.query(INSERT_LESSON_GRADING, [
                lesson.contentId,
                lesson.version,
                toGradingPayload(grading),
                now,
            ])
            return "published" as const
        })
        const result: ImportReport = {
            contentId: lesson.contentId,
            version: lesson.version,
            status: report,
            sourceHash: lesson.sourceHash,
            variants: Object.keys(lesson.variants).length,
            locales: Object.keys(lesson.metadata).length,
            challenges: lesson.challenges.length,
            protectedInterviewItems: Object.values(grading.interviews).reduce(
                (count, items) => count + items.length,
                0,
            ),
            fileHashes: source.fileHashes,
        }
        this.logger.info(LessonContentLogEvent.LessonsImported, {
            contentId: result.contentId,
            version: result.version,
            status: result.status,
            sourceHash: result.sourceHash,
            variants: result.variants,
            locales: result.locales,
            challenges: result.challenges,
            protectedInterviewItems: result.protectedInterviewItems,
        })
        return result
    }

    /**
     * The public projection of one published variant: the complete article minus its protected ranges when access is
     * allowed, the exact section-1 range plus the complete outline when it is locked. A missing combination names
     * the available ones and never falls back silently.
     */
    async readLesson(params: ReadLessonParams): Promise<PublicLesson> {
        const lesson = await this.loadPublished(params.contentId, params.version)
        const variant = lesson.variants[variantKey(params.programmingLanguage, params.locale)]
        if (variant === undefined) {
            throw new LessonContentError({
                code: LessonContentErrorCode.VariantUnavailable,
                params: {
                    contentId: params.contentId,
                    programmingLanguage: params.programmingLanguage,
                    locale: params.locale,
                    available: Object.keys(lesson.variants).join(","),
                },
            })
        }
        return projectPublicLesson(lesson, variant, params.locale, params.programmingLanguage, params.access)
    }

    /**
     * The reveal of one interview item: only when the caller proves a persisted answer for that exact item, and only
     * that item's points and sample answer — never the rest of the grading.
     */
    async revealInterview(params: RevealInterviewParams): Promise<InterviewReveal> {
        if (!params.answeredItemIds.includes(params.itemId)) {
            throw new LessonContentError({
                code: LessonContentErrorCode.AnswerRequired,
                params: { itemId: params.itemId },
            })
        }
        const grading = await this.loadGrading(params.contentId, params.version)
        const items = grading.interviews[variantKey(params.programmingLanguage, params.locale)] ?? []
        const item = items.find((entry) => entry.itemId === params.itemId)
        if (item === undefined) {
            throw new LessonContentError({ code: LessonContentErrorCode.NotFound, params: { itemId: params.itemId } })
        }
        return item
    }

    /** The published lesson of one content id: the named version, or the newest when none is named. */
    private async loadPublished(contentId: string, version?: string): Promise<PublishedLesson> {
        const row =
            version === undefined
                ? await this.entityManager.findOne(LessonContentVersionEntity, {
                      where: { contentId },
                      order: { createdAt: "DESC" },
                  })
                : await this.entityManager.findOne(LessonContentVersionEntity, { where: { contentId, version } })
        if (row === null) {
            throw new LessonContentError({
                code: LessonContentErrorCode.NotFound,
                params: { contentId, version: version ?? "latest" },
            })
        }
        return toPublishedLesson(row.payload)
    }

    /** The server-only grading of one published version. */
    private async loadGrading(contentId: string, version: string): Promise<ProtectedGrading> {
        const row = await this.entityManager.findOne(LessonContentGradingEntity, { where: { contentId, version } })
        if (row === null) {
            throw new LessonContentError({ code: LessonContentErrorCode.NotFound, params: { contentId, version } })
        }
        return toProtectedGrading(row.payload)
    }
}
