import { LessonContentModule, LessonContentService } from "@modules/domain/lesson-content"
import { LessonContentErrorCode } from "@modules/domain/lesson-content/errors/lesson-content.error"
import {
    ACADEMY_FIXTURE_DIR,
    articleOf,
    CHALLENGE_IDS,
    CONTENT_ID,
    LANGUAGES,
    LOCALES,
    publicArticleOf,
    readManifest,
    reissuedCopy,
    sliceOf,
    tamperedCopy,
    VERSION,
} from "../../fixtures/lessons/academy-fixture"
import type { Language, Locale } from "../../fixtures/lessons/academy-fixture"
import { useTestWorld } from "../../world/use-test-world"

const PUBLIC_LESSON_KEYS = [
    "access",
    "article",
    "availableLocales",
    "challengePrompts",
    "description",
    "id",
    "isPremium",
    "locale",
    "minutesRead",
    "outline",
    "programmingLanguage",
    "programmingLanguages",
    "stepPrompts",
    "title",
    "verifiedAt",
    "version",
]

/**
 * lesson-content: the real capability over the real primary database of the run, importing the committed Academy
 * snapshot and projecting it for public, locked and server-only readers.
 */
describe("lesson-content: versioned Academy lesson over the real database (integration)", () => {
    const world = useTestWorld({
        modules: [() => LessonContentModule.register({ isGlobal: true })],
    })

    const lessons = (): LessonContentService => world.resolve(LessonContentService)

    const read = (programmingLanguage: Language, locale: Locale, access: "allowed" | "locked") =>
        lessons().readLesson({ contentId: CONTENT_ID, version: VERSION, programmingLanguage, locale, access })

    const rowCount = async (table: string): Promise<number> => {
        const rows: Array<{ n: string }> = await world.db.primary.query(`SELECT count(*)::text AS n FROM ${table}`)
        return Number(rows[0]?.n)
    }

    beforeAll(async () => {
        await lessons().importLessons({ fixtureDir: ACADEMY_FIXTURE_DIR })
    })

    it("publishes all eight language and locale bodies, both locales and four challenges with every file hash", async () => {
        const report = await lessons().importLessons({ fixtureDir: ACADEMY_FIXTURE_DIR })
        const manifest = await readManifest()

        expect(report).toMatchObject({
            contentId: CONTENT_ID,
            version: VERSION,
            variants: 8,
            locales: 2,
            challenges: 4,
            protectedInterviewItems: 24,
        })
        expect(Object.keys(report.fileHashes).sort()).toEqual(manifest.files.map((file) => file.fixturePath).sort())
        for (const file of manifest.files) expect(report.fileHashes[file.fixturePath]).toBe(file.sha256)
    })

    it("splits every body into its own frame: section 1, the 2.1 hands-on sections, 2.2 theory and 3.1 interviews", async () => {
        const manifest = await readManifest()
        for (const language of LANGUAGES) {
            for (const locale of LOCALES) {
                const lesson = await read(language, locale, "allowed")
                const recorded = articleOf(manifest, language, locale)
                const ids = lesson.outline.map((entry) => entry.id)

                expect(lesson.outline.map(({ id, depth, text }) => ({ id, depth, text }))).toEqual(
                    recorded.outline.map(({ id, depth, text }) => ({ id, depth, text })),
                )
                expect(ids).toEqual(expect.arrayContaining(["section-1", "section-2.1", "section-2.2", "section-3.1"]))
                expect(ids.filter((id) => id.startsWith("section-2.1.")).length).toBeGreaterThan(0)
                expect(lesson.programmingLanguage).toBe(language)
                expect(lesson.locale).toBe(locale)
                expect(lesson.stepPrompts.map((prompt) => prompt.itemId)).toEqual([
                    "interview-1",
                    "interview-2",
                    "interview-3",
                ])
                expect(lesson.challengePrompts.map((challenge) => challenge.id)).toEqual([...CHALLENGE_IDS])
            }
        }
    })

    it("projects the public article as the original public ranges in source order, byte for byte", async () => {
        const manifest = await readManifest()
        for (const article of manifest.articles) {
            const lesson = await read(article.programmingLanguage, article.locale, "allowed")

            expect(lesson.article).toBe(await publicArticleOf(article))
        }
    })

    it("carries the source metadata of each locale", async () => {
        const en = await read("go", "en", "allowed")
        const vi = await read("go", "vi", "allowed")

        expect(en).toMatchObject({
            id: CONTENT_ID,
            version: VERSION,
            title: "REST semantics: the HTTP verb and status code contract",
            minutesRead: 20,
            isPremium: false,
            verifiedAt: "2026-06-02",
            availableLocales: ["en", "vi"],
            programmingLanguages: ["typescript", "java", "csharp", "go"],
            access: "allowed",
        })
        expect(vi.title).not.toBe(en.title)
    })

    it("exposes no sample answer, interviewer point, rubric or solution in a public read", async () => {
        const manifest = await readManifest()
        for (const article of manifest.articles) {
            const lesson = await read(article.programmingLanguage, article.locale, "allowed")
            const serialized = JSON.stringify(lesson)

            for (const range of article.protectedRanges) {
                const secret = (await sliceOf(article.fixturePath, range)).trim()
                expect(secret.length).toBeGreaterThan(20)
                expect(serialized).not.toContain(secret)
            }
            expect(Object.keys(lesson).sort()).toEqual(PUBLIC_LESSON_KEYS)
            for (const challenge of lesson.challengePrompts) {
                expect(Object.keys(challenge).sort()).toEqual([
                    "description",
                    "difficulty",
                    "id",
                    "prerequisites",
                    "requirements",
                    "title",
                ])
            }
        }
    })

    it("keeps every interview prompt public as the original question text without its bullet markers", async () => {
        const article = articleOf(await readManifest(), "java", "en")
        const lesson = await read("java", "en", "allowed")

        for (const [position, question] of article.interviewQuestions.entries()) {
            const prompt = lesson.stepPrompts[position]
            const original = await sliceOf(article.fixturePath, { start: question.promptStart, end: question.promptEnd })

            expect(prompt?.prompt).toBe(/^- \*\*(.+)\*\*$/s.exec(original.trim())?.[1])
            expect(prompt).toMatchObject({
                stepId: "interview",
                itemId: question.id,
                kind: "interview",
                requiredFields: ["answer"],
            })
        }
    })

    it("locks to exactly section 1 and the complete outline, with no later body or protected text", async () => {
        const manifest = await readManifest()
        for (const article of manifest.articles) {
            const locked = await read(article.programmingLanguage, article.locale, "locked")
            const allowed = await read(article.programmingLanguage, article.locale, "allowed")

            expect(locked.access).toBe("locked")
            expect(locked.article).toBe(await sliceOf(article.fixturePath, article.section1))
            expect(locked.article.length).toBeLessThan(allowed.article.length)
            expect(locked.outline).toEqual(allowed.outline)
            expect(locked.outline.map((entry) => entry.id)).toContain("section-3.1")
            for (const range of article.protectedRanges) {
                expect(JSON.stringify(locked)).not.toContain((await sliceOf(article.fixturePath, range)).trim())
            }
        }
    })

    it("reveals only the answered item's interviewer points and sample answer on the server-only path", async () => {
        const article = articleOf(await readManifest(), "csharp", "vi")
        const first = article.interviewQuestions[0]
        const points = first?.protectedRanges.find((range) => range.kind === "interviewerPoints")
        const sample = first?.protectedRanges.find((range) => range.kind === "sampleAnswer")
        if (points === undefined || sample === undefined) throw new Error("fixture interview-1 has no protected ranges")

        const reveal = await lessons().revealInterview({
            contentId: CONTENT_ID,
            version: VERSION,
            programmingLanguage: "csharp",
            locale: "vi",
            itemId: "interview-1",
            answeredItemIds: ["interview-1"],
        })

        expect(reveal.itemId).toBe("interview-1")
        expect(reveal.interviewerPoints.trim()).toBe((await sliceOf(article.fixturePath, points)).trim())
        expect(reveal.sampleAnswer.trim()).toBe((await sliceOf(article.fixturePath, sample)).trim())
        expect(Object.keys(reveal).sort()).toEqual(["interviewerPoints", "itemId", "sampleAnswer"])
    })

    it("refuses a reveal for an item with no persisted answer", async () => {
        await expect(
            lessons().revealInterview({
                contentId: CONTENT_ID,
                version: VERSION,
                programmingLanguage: "go",
                locale: "en",
                itemId: "interview-2",
                answeredItemIds: ["interview-1"],
            }),
        ).rejects.toMatchObject({ code: LessonContentErrorCode.AnswerRequired })
    })

    it("refuses an unknown lesson and an unpublished locale without falling back", async () => {
        await expect(
            lessons().readLesson({
                contentId: CONTENT_ID,
                version: VERSION,
                programmingLanguage: "go",
                locale: "fr" as Locale,
                access: "allowed",
            }),
        ).rejects.toMatchObject({ code: LessonContentErrorCode.VariantUnavailable })
        await expect(
            lessons().readLesson({
                contentId: "unknown-lesson",
                programmingLanguage: "go",
                locale: "en",
                access: "allowed",
            }),
        ).rejects.toMatchObject({ code: LessonContentErrorCode.NotFound })
    })

    it("reads the newest version when none is named", async () => {
        const named = await read("typescript", "en", "allowed")
        const latest = await lessons().readLesson({
            contentId: CONTENT_ID,
            programmingLanguage: "typescript",
            locale: "en",
            access: "allowed",
        })

        expect(latest).toEqual(named)
    })

    it("is idempotent: a reimport is unchanged and stores no second row", async () => {
        const before = [await rowCount("lesson_content_versions"), await rowCount("lesson_content_grading")]
        const again = await lessons().importLessons({ fixtureDir: ACADEMY_FIXTURE_DIR })
        const after = [await rowCount("lesson_content_versions"), await rowCount("lesson_content_grading")]

        expect(again.status).toBe("unchanged")
        expect(before).toEqual([1, 1])
        expect(after).toEqual(before)
    })

    it("refuses a tampered byte and leaves the published version as it was", async () => {
        const tampered = await tamperedCopy(world.scratchDir("tampered-body"), "original/bodies/3-go/en.md")
        const before = await read("go", "en", "allowed")

        await expect(lessons().importLessons({ fixtureDir: tampered })).rejects.toMatchObject({
            code: LessonContentErrorCode.SourceMismatch,
            params: { field: "original/bodies/3-go/en.md" },
        })
        expect(await read("go", "en", "allowed")).toEqual(before)
        expect(await rowCount("lesson_content_versions")).toBe(1)
    })

    it("refuses the same version imported from other bytes as an immutable-version conflict", async () => {
        const reissued = await reissuedCopy(world.scratchDir("reissued-manifest"))
        const before = await read("java", "vi", "allowed")

        await expect(lessons().importLessons({ fixtureDir: reissued })).rejects.toMatchObject({
            code: LessonContentErrorCode.VersionConflict,
            params: { contentId: CONTENT_ID, version: VERSION },
        })
        expect(await read("java", "vi", "allowed")).toEqual(before)
        expect(await rowCount("lesson_content_versions")).toBe(1)
        expect(await rowCount("lesson_content_grading")).toBe(1)
    })
})
