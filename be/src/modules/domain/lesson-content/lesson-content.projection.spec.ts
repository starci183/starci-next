import { FakeClock, mock, mockEntityManager } from "@starci/jest-preset"
import type { MockEntityManager } from "@starci/jest-preset"
import { Test } from "@nestjs/testing"
import { CLOCK } from "@modules/platform/clock"
import { LOGGER } from "@modules/platform/logging"
import type { Logger } from "@modules/platform/logging"
import { PRIMARY_ENTITY_MANAGER } from "@modules/platform/database"
import { LessonContentError, LessonContentErrorCode } from "./errors/lesson-content.error"
import { LessonContentService } from "./lesson-content.service"
import { LessonContentGradingEntity, LessonContentVersionEntity } from "./persistence/entities/lesson-content.entity"
import { toVersionPayload } from "./persistence/lesson-content.rows"
import type { PublishedLesson, RevealInterviewParams } from "./lesson-content.contracts"

const specError = (reason: string): LessonContentError =>
    new LessonContentError({ code: LessonContentErrorCode.PayloadCorrupt, params: { reason } })

const parseJson = (text: string): unknown => {
    try {
        return JSON.parse(text)
    } catch (error) {
        throw new LessonContentError({
            code: LessonContentErrorCode.ManifestInvalid,
            params: { field: "manifest.json" },
            cause: error,
        })
    }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null && !Array.isArray(value)

const recordsOf = (manifest: Record<string, unknown>, field: string): Array<Record<string, unknown>> => {
    const value = manifest[field]
    if (!Array.isArray(value) || !value.every(isRecord)) throw specError(`no ${field}`)
    return value
}

const NOW = "2026-01-01T00:00:00.000Z"
const encode = (text: string): Uint8Array => new TextEncoder().encode(text)

const build = async (entityManager: MockEntityManager) => {
    const logger = mock<Logger>()
    const moduleRef = await Test.createTestingModule({
        providers: [
            LessonContentService,
            { provide: PRIMARY_ENTITY_MANAGER, useValue: entityManager },
            { provide: CLOCK, useValue: new FakeClock(NOW) },
            { provide: LOGGER, useValue: logger },
        ],
    }).compile()
    return { service: moduleRef.get(LessonContentService), logger }
}

const variant = () => ({
    raw: encode("## 1. A\n## 2. B\n- **Q?**\n  - pts\n  - ans\n"),
    index: {
        article: { start: 0, end: 41 },
        section1: { start: 0, end: 8 },
        outline: [
            { id: "section-1", depth: 2, text: "1. A", start: 0, end: 8 },
            { id: "section-2", depth: 2, text: "2. B", start: 8, end: 16 },
        ],
        protectedRanges: [
            { start: 25, end: 33, kind: "interviewerPoints" as const },
            { start: 33, end: 41, kind: "sampleAnswer" as const },
        ],
        interviewQuestions: [
            {
                id: "interview-1",
                promptStart: 16,
                promptEnd: 25,
                protectedRanges: [
                    { start: 25, end: 33, kind: "interviewerPoints" as const },
                    { start: 33, end: 41, kind: "sampleAnswer" as const },
                ],
            },
        ],
        publicArticleRanges: [{ start: 0, end: 25 }],
    },
    sha256: "h",
})
const definition = () => ({
    title: "T",
    description: "D",
    difficulty: "easy" as const,
    requirements: { typescript: [{ title: "r", body: "b" }], java: [], csharp: [], go: [] },
    prerequisites: { typescript: ["p"], java: [], csharp: [], go: [] },
})
const lesson = (): PublishedLesson => ({
    contentId: "academy-rest-semantics",
    version: "1.0.0",
    sourceHash: "s",
    metadata: {
        en: { title: "T", description: "D", minutesRead: 20, isPremium: true, verifiedAt: "2026-06-02" },
        vi: { title: "Tv", description: "Dv", minutesRead: 20, isPremium: true, verifiedAt: null },
    },
    variants: { "typescript:en": variant(), "typescript:vi": variant() },
    challenges: [{ id: "c1", order: 0, definitions: { en: definition(), vi: definition() } }],
})
const versionRow = (payload: unknown) => ({
    contentId: "academy-rest-semantics",
    version: "1.0.0",
    sourceHash: "s",
    payload,
    createdAt: new Date(NOW),
})
const storedLesson = (): unknown => parseJson(toVersionPayload(lesson()))

describe("LessonContentService readLesson projects the stored lesson", () => {
    it("answers the public projection: article without protected ranges, prompts, challenges", async () => {
        const { service } = await build(
            mockEntityManager({ findOne: [LessonContentVersionEntity, versionRow(storedLesson())] }),
        )

        const view = await service.readLesson({
            contentId: "academy-rest-semantics",
            locale: "en",
            programmingLanguage: "typescript",
            access: "allowed",
        })

        expect(view.access).toBe("allowed")
        expect(view.article).toBe("## 1. A\n## 2. B\n- **Q?**\n")
        expect(view.article).not.toContain("pts")
        expect(view.outline).toHaveLength(2)
        expect(view.stepPrompts).toEqual([
            {
                stepId: "interview",
                itemId: "interview-1",
                promptVersion: "h",
                kind: "interview",
                prompt: "Q?",
                requiredFields: ["answer"],
            },
        ])
        expect(view.challengePrompts).toEqual([
            {
                id: "c1",
                title: "T",
                description: "D",
                difficulty: "easy",
                requirements: [{ title: "r", body: "b" }],
                prerequisites: ["p"],
            },
        ])
        expect(view.availableLocales).toEqual(["en", "vi"])
        expect(view.programmingLanguages).toEqual(["typescript"])
    })

    it("answers the locked preview: the exact section-1 range and the complete outline", async () => {
        const { service } = await build(
            mockEntityManager({ findOne: [LessonContentVersionEntity, versionRow(storedLesson())] }),
        )

        const view = await service.readLesson({
            contentId: "academy-rest-semantics",
            locale: "en",
            programmingLanguage: "typescript",
            access: "locked",
        })

        expect(view.access).toBe("locked")
        expect(view.article).toBe("## 1. A\n")
        expect(view.outline).toHaveLength(2)
    })
})

describe("LessonContentService readLesson answers fail-closed", () => {
    it("reads the newest version when none is named", async () => {
        const em = mockEntityManager({ findOne: [LessonContentVersionEntity, versionRow(storedLesson())] })
        const { service } = await build(em)

        await service.readLesson({
            contentId: "academy-rest-semantics",
            locale: "en",
            programmingLanguage: "typescript",
            access: "allowed",
        })

        expect(em.findOne).toHaveBeenCalledWith(LessonContentVersionEntity, {
            where: { contentId: "academy-rest-semantics" },
            order: { createdAt: "DESC" },
        })
    })

    it("fails closed when no version is published", async () => {
        const { service } = await build(mockEntityManager({ findOne: [LessonContentVersionEntity, null] }))

        await expect(
            service.readLesson({
                contentId: "missing",
                locale: "en",
                programmingLanguage: "typescript",
                access: "allowed",
            }),
        ).rejects.toThrow(LessonContentErrorCode.NotFound)
    })

    it("fails closed when the stored payload is corrupt", async () => {
        const { service } = await build(
            mockEntityManager({ findOne: [LessonContentVersionEntity, versionRow("junk")] }),
        )

        await expect(
            service.readLesson({
                contentId: "c",
                version: "1.0.0",
                locale: "en",
                programmingLanguage: "typescript",
                access: "allowed",
            }),
        ).rejects.toThrow(LessonContentErrorCode.PayloadCorrupt)
    })
})

describe("LessonContentService readLesson refuses unavailable variants", () => {
    it("refuses a missing variant and names the available combinations", async () => {
        const { service } = await build(
            mockEntityManager({ findOne: [LessonContentVersionEntity, versionRow(storedLesson())] }),
        )

        const rejected: unknown = await service
            .readLesson({
                contentId: "academy-rest-semantics",
                locale: "en",
                programmingLanguage: "go",
                access: "allowed",
            })
            .catch((error: unknown) => error)

        expect(rejected).toMatchObject({
            code: LessonContentErrorCode.VariantUnavailable,
            params: { available: "typescript:en,typescript:vi" },
        })
    })

    it("fails closed when the stored metadata or challenge lacks the locale", async () => {
        const stored: unknown = parseJson(toVersionPayload(lesson()))
        if (!isRecord(stored) || !isRecord(stored.metadata)) throw specError("no metadata")
        delete stored.metadata.vi
        const { service } = await build(
            mockEntityManager({ findOne: [LessonContentVersionEntity, versionRow(stored)] }),
        )

        await expect(
            service.readLesson({
                contentId: "academy-rest-semantics",
                locale: "vi",
                programmingLanguage: "typescript",
                access: "allowed",
            }),
        ).rejects.toThrow(LessonContentErrorCode.VariantUnavailable)

        const secondStored: unknown = parseJson(toVersionPayload(lesson()))
        if (!isRecord(secondStored)) throw specError("no lesson")
        const challenges = recordsOf(secondStored, "challenges")
        const first = challenges[0]
        if (first === undefined || !isRecord(first.definitions)) throw specError("no definitions")
        delete first.definitions.vi
        const { service: second } = await build(
            mockEntityManager({ findOne: [LessonContentVersionEntity, versionRow(secondStored)] }),
        )

        await expect(
            second.readLesson({
                contentId: "academy-rest-semantics",
                locale: "vi",
                programmingLanguage: "typescript",
                access: "allowed",
            }),
        ).rejects.toThrow(LessonContentErrorCode.VariantUnavailable)
    })
})

const gradingRow = {
    contentId: "c",
    version: "1.0.0",
    payload: {
        contentId: "c",
        version: "1.0.0",
        interviews: {
            "typescript:en": [{ itemId: "interview-1", interviewerPoints: "pts", sampleAnswer: "ans" }],
        },
        challenges: {},
    },
    createdAt: new Date(NOW),
}
const params = (overrides: Partial<RevealInterviewParams> = {}): RevealInterviewParams => ({
    contentId: "c",
    version: "1.0.0",
    programmingLanguage: "typescript",
    locale: "en",
    itemId: "interview-1",
    answeredItemIds: ["interview-1"],
    ...overrides,
})

describe("LessonContentService revealInterview", () => {
    it("reveals the one item the learner answered", async () => {
        const em = mockEntityManager({ findOne: [LessonContentGradingEntity, gradingRow] })
        const { service } = await build(em)

        const reveal = await service.revealInterview(params())

        expect(reveal).toEqual({ itemId: "interview-1", interviewerPoints: "pts", sampleAnswer: "ans" })
    })

    it("refuses an item the learner has not answered, without reading the store", async () => {
        const { service } = await build(mockEntityManager())

        await expect(service.revealInterview(params({ itemId: "interview-2" }))).rejects.toThrow(
            LessonContentErrorCode.AnswerRequired,
        )
    })

    it("refuses an answered item the version does not carry and a missing grading row", async () => {
        const em = mockEntityManager({ findOne: [LessonContentGradingEntity, gradingRow] })
        const { service } = await build(em)

        await expect(
            service.revealInterview(
                params({ programmingLanguage: "go", itemId: "interview-9", answeredItemIds: ["interview-9"] }),
            ),
        ).rejects.toThrow(LessonContentErrorCode.NotFound)

        const missing = mockEntityManager({ findOne: [LessonContentGradingEntity, null] })
        const { service: second } = await build(missing)

        await expect(second.revealInterview(params())).rejects.toThrow(LessonContentErrorCode.NotFound)
    })
})
