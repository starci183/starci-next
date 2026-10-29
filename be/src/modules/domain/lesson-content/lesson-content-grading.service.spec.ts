import { mockEntityManager } from "@starci/jest-preset"
import type { MockEntityManager } from "@starci/jest-preset"
import { Test } from "@nestjs/testing"
import { PRIMARY_ENTITY_MANAGER } from "@modules/platform/database"
import { LessonContentError, LessonContentErrorCode } from "./errors/lesson-content.error"
import { LessonContentGradingService } from "./lesson-content-grading.service"
import { LessonContentGradingEntity, LessonContentVersionEntity } from "./persistence/entities/lesson-content.entity"
import { toGradingPayload, toVersionPayload } from "./persistence/lesson-content.rows"
import type { ChallengeGrading, ProtectedGrading, PublishedLesson } from "./lesson-content.contracts"
import { LESSON_LOCALES, PROGRAMMING_LANGUAGES } from "./lesson-content.contracts"

const NOW = "2026-01-01T00:00:00.000Z"
const encode = (text: string): Uint8Array => new TextEncoder().encode(text)
const parsePayload = (text: string): unknown => {
    try {
        return JSON.parse(text)
    } catch (cause) {
        throw new LessonContentError({ code: LessonContentErrorCode.PayloadCorrupt, cause })
    }
}

const langLabel = (language: string): string => {
    if (language === "typescript") return "TS"
    if (language === "csharp") return "C#"
    if (language === "java") return "Java"
    return "Go"
}

const variant = () => ({
    raw: encode("## 1. A\n## 2. B\n- **Q?**\n  - points\n  - answer\n"),
    index: {
        article: { start: 0, end: 47 },
        section1: { start: 0, end: 8 },
        outline: [
            { id: "section-1", depth: 2, text: "1. A", start: 0, end: 8 },
            { id: "section-2", depth: 2, text: "2. B", start: 8, end: 16 },
        ],
        protectedRanges: [{ start: 27, end: 36, kind: "interviewerPoints" as const }],
        interviewQuestions: [
            {
                id: "interview-1",
                promptStart: 16,
                promptEnd: 27,
                protectedRanges: [{ start: 27, end: 36, kind: "interviewerPoints" as const }],
            },
        ],
        publicArticleRanges: [{ start: 0, end: 27 }],
    },
    sha256: "body-hash",
})

const lesson = (): PublishedLesson => ({
    contentId: "academy-rest-semantics",
    version: "1.0.0",
    sourceHash: "source-hash",
    metadata: {
        en: { title: "English", description: "English", minutesRead: 20, isPremium: false, verifiedAt: null },
        vi: { title: "Vietnamese", description: "Vietnamese", minutesRead: 20, isPremium: false, verifiedAt: null },
    },
    variants: Object.fromEntries(
        PROGRAMMING_LANGUAGES.flatMap((language) => LESSON_LOCALES.map((locale) => [`${language}:${locale}`, variant()])),
    ),
    challenges: [0, 1, 2, 3].map((index) => ({
        id: `challenge-${index}`,
        order: index,
        definitions: {
            en: { title: "English challenge", description: "English", difficulty: "easy" as const, requirements: { typescript: [], java: [], csharp: [], go: [] }, prerequisites: { typescript: [], java: [], csharp: [], go: [] } },
            vi: { title: "Vietnamese challenge", description: "Vietnamese", difficulty: "easy" as const, requirements: { typescript: [], java: [], csharp: [], go: [] }, prerequisites: { typescript: [], java: [], csharp: [], go: [] } },
        },
    })),
})

const challengeGrade = (locale: string): ChallengeGrading => ({
    verifiedAt: "2026-06-02",
    scoreWeight: 100,
    requirementScores: { typescript: [], java: [], csharp: [], go: [] },
    solutionSteps: [],
    expectedOutputs: [],
    submissionType: "githubUrl",
    submissionTitle: `Title ${locale}`,
    submissionDescription: `Description ${locale}`,
    submissionScore: 20,
    outcomeCriterias: [{
        bodies: { typescript: "TS outcome", java: "Java outcome", csharp: "C# outcome", go: "Go outcome" },
        score: 12,
        critical: true,
    }],
    approachCriterias: [{
        bodies: { typescript: "TS approach", java: "Java approach", csharp: "C# approach", go: "Go approach" },
        score: 8,
        critical: false,
    }],
    sha256: "submission-hash",
    raw: "RAW SUBMISSION SECRET",
})

const protectedGrading = (): ProtectedGrading => ({
    contentId: "academy-rest-semantics",
    version: "1.0.0",
    interviews: Object.fromEntries(
        PROGRAMMING_LANGUAGES.flatMap((language) =>
            LESSON_LOCALES.map((locale) => [
                `${language}:${locale}`,
                [{ itemId: "interview-1", interviewerPoints: `${language}/${locale} points`, sampleAnswer: "SAMPLE SECRET" }],
            ]),
        ),
    ),
    challenges: Object.fromEntries(
        LESSON_LOCALES.flatMap((locale) => [0, 1, 2, 3].map((index) => [`challenge-${index}:${locale}`, challengeGrade(locale)])),
    ),
})

const versionRow = () => ({
    contentId: "academy-rest-semantics",
    version: "1.0.0",
    sourceHash: "source-hash",
    payload: parsePayload(toVersionPayload(lesson())),
    createdAt: new Date(NOW),
})

const gradingRow = () => ({
    contentId: "academy-rest-semantics",
    version: "1.0.0",
    payload: parsePayload(toGradingPayload(protectedGrading())),
    createdAt: new Date(NOW),
})

const build = async (entityManager: MockEntityManager) => {
    const moduleRef = await Test.createTestingModule({
        providers: [
            LessonContentGradingService,
            { provide: PRIMARY_ENTITY_MANAGER, useValue: entityManager },
        ],
    }).compile()
    return { service: moduleRef.get(LessonContentGradingService) }
}

describe("LessonContentGradingService gradingFor returns grading allowlists", () => {
    it("returns the locale and language-specific allowlist for every fixture variant", async () => {
        for (const programmingLanguage of PROGRAMMING_LANGUAGES) {
            for (const locale of LESSON_LOCALES) {
                const em = mockEntityManager({
                    findOne: [
                        [LessonContentVersionEntity, versionRow()],
                        [LessonContentGradingEntity, gradingRow()],
                    ],
                })
                const { service } = await build(em)
                const result = await service.gradingFor({
                    contentId: "academy-rest-semantics",
                    version: "1.0.0",
                    locale,
                    programmingLanguage,
                })

                expect(result.interviewPoints).toEqual([
                    { itemId: "interview-1", interviewerPoints: `${programmingLanguage}/${locale} points` },
                ])
                expect(result.challenges).toHaveLength(4)
                expect(result.challenges[0]).toMatchObject({
                    challengeId: "challenge-0",
                    submissionType: "githubUrl",
                    submissionTitle: `Title ${locale}`,
                    outcomeCriteria: [{ body: `${langLabel(programmingLanguage)} outcome`, score: 12, critical: true }],
                    approachCriteria: [{ score: 8, critical: false }],
                })
                expect(JSON.stringify(result)).not.toContain("SAMPLE SECRET")
                expect(JSON.stringify(result)).not.toContain("RAW SUBMISSION SECRET")
                expect(JSON.stringify(result)).not.toContain("submission-hash")
                expect(JSON.stringify(result)).not.toContain("solutionSteps")
            }
        }
    })

    it("refuses an unknown version with the lesson-content not-found error", async () => {
        const em = mockEntityManager({ findOne: [LessonContentVersionEntity, null] })
        const { service } = await build(em)

        await expect(service.gradingFor({
            contentId: "academy-rest-semantics",
            version: "missing",
            locale: "en",
            programmingLanguage: "typescript",
        })).rejects.toThrow(LessonContentErrorCode.NotFound)
    })

})

describe("LessonContentGradingService gradingFor refuses unavailable data", () => {
    it("refuses an unpublished locale/language variant with the lesson-content variant error", async () => {
        const sparseLesson = lesson()
        const row = {
            ...versionRow(),
            payload: parsePayload(toVersionPayload({ ...sparseLesson, variants: { "typescript:en": variant() } })),
        }
        const em = mockEntityManager({ findOne: [LessonContentVersionEntity, row] })
        const { service } = await build(em)

        await expect(service.gradingFor({
            contentId: "academy-rest-semantics",
            version: "1.0.0",
            locale: "vi",
            programmingLanguage: "typescript",
        })).rejects.toThrow(LessonContentErrorCode.VariantUnavailable)
    })

    it("refuses a missing grading row with the lesson-content not-found error", async () => {
        const em = mockEntityManager({
            findOne: [
                [LessonContentVersionEntity, versionRow()],
                [LessonContentGradingEntity, null],
            ],
        })
        const { service } = await build(em)

        await expect(service.gradingFor({
            contentId: "academy-rest-semantics",
            version: "1.0.0",
            locale: "en",
            programmingLanguage: "typescript",
        })).rejects.toThrow(LessonContentErrorCode.NotFound)
    })

    it("refuses malformed stored grading when a variant's interview points are missing", async () => {
        const malformed = { ...protectedGrading(), interviews: {} }
        const em = mockEntityManager({
            findOne: [
                [LessonContentVersionEntity, versionRow()],
                [LessonContentGradingEntity, { ...gradingRow(), payload: parsePayload(toGradingPayload(malformed)) }],
            ],
        })
        const { service } = await build(em)

        await expect(service.gradingFor({
            contentId: "academy-rest-semantics",
            version: "1.0.0",
            locale: "en",
            programmingLanguage: "typescript",
        })).rejects.toThrow(LessonContentErrorCode.PayloadCorrupt)
    })

    it("refuses malformed stored grading when a challenge rubric is missing", async () => {
        const grading = protectedGrading()
        const challenges = Object.fromEntries(
            Object.entries(grading.challenges).filter(([key]) => key !== "challenge-0:en"),
        )
        const malformed = { ...grading, challenges }
        const em = mockEntityManager({
            findOne: [
                [LessonContentVersionEntity, versionRow()],
                [LessonContentGradingEntity, { ...gradingRow(), payload: parsePayload(toGradingPayload(malformed)) }],
            ],
        })
        const { service } = await build(em)

        await expect(service.gradingFor({
            contentId: "academy-rest-semantics",
            version: "1.0.0",
            locale: "en",
            programmingLanguage: "typescript",
        })).rejects.toThrow(LessonContentErrorCode.PayloadCorrupt)
    })
})
