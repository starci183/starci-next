import { Test } from "@nestjs/testing"
import {
    DEMO_SOURCE_KEY,
    demoFilesOf,
    demoTopicCatalogOf,
    demoLocaleFilesOf,
    demoRootOf,
    separatorTextOf,
    sourceFileOf,
} from "@tests/fixtures/builders/lesson.builder"
import type { LessonSourceFile } from "./lesson-import.contracts"
import { buildLessonDraft, contentHashOf, lessonIdOf } from "./lesson-draft.policy"

const DRAFT_POLICY: unique symbol = Symbol("lesson.draft-policy")
const policies = {
    buildLessonDraft: (folder: string, files: ReadonlyArray<LessonSourceFile>) =>
        buildLessonDraft(folder, files, demoTopicCatalogOf()),
    buildWith: buildLessonDraft,
    contentHashOf,
    lessonIdOf,
}

const build = async (): Promise<typeof policies> => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: DRAFT_POLICY, useFactory: () => policies }],
    }).compile()
    return moduleRef.get<typeof policies>(DRAFT_POLICY)
}

describe("lessonIdOf", () => {
    it("drops the numeric order prefix of a concept folder and keeps the rest", async () => {
        const { lessonIdOf: idOf } = await build()

        expect(idOf("2-cqrs-read-models")).toBe("cqrs-read-models")
        expect(idOf("cqrs-read-models")).toBe("cqrs-read-models")
    })
})

describe("contentHashOf", () => {
    it("is one value for the folder that does not depend on the order the files were read in", async () => {
        const { contentHashOf: hashOf } = await build()
        const files = demoFilesOf()

        expect(hashOf(files)).toBe(hashOf([...files].reverse()))
        expect(hashOf(files)).toMatch(/^[0-9a-f]{64}$/u)
    })

    it("changes when the bytes of any file change", async () => {
        const { contentHashOf: hashOf } = await build()
        const files = demoFilesOf()
        const changed = files.map((file) =>
            file.path === "workspace/source.ts" ? sourceFileOf(file.path, "export const source = 2\n") : file,
        )

        expect(hashOf(changed)).not.toBe(hashOf(files))
    })
})

describe("buildLessonDraft", () => {
    it("builds a draft with the metadata, both locales, the workspace files and the raw hash of every file", async () => {
        const { buildLessonDraft: draftOf } = await build()
        const files = demoFilesOf()
        const result = draftOf("2-demo-lesson", files)

        expect(result.issues).toEqual([])
        expect(result.draft).toMatchObject({
            id: "demo-lesson",
            category: "backend",
            group: "backend",
            difficulty: "intermediate",
            minutesRead: 95,
            implementation: "typescript",
            sortIndex: 2,
        })
        expect(result.draft?.content.locales.en.title).toBe("en: Demo lesson")
        expect(result.draft?.content.locales.vi.retrieval.map((activity) => activity.id)).toEqual(["demo--review"])
        expect(result.draft?.content.files).toEqual([
            { path: "workspace/source.test.ts", role: "test", content: "export const test = 1\n" },
            { path: "workspace/source.ts", role: "source", content: "export const source = 1\n" },
        ])
        expect(Object.keys(result.draft?.sourceHashes ?? {})).toEqual([...files.map((file) => file.path)].sort())
        expect(result.draft?.contentHash).toHaveLength(64)
    })
})

describe("buildLessonDraft variants", () => {
    it("builds a draft with no workspace for a concept that declares none", async () => {
        const { buildLessonDraft: draftOf } = await build()
        const { workspace: _declared, activities: _reviews, ...root } = demoRootOf("vi")
        const { workspace: _declaredEn, activities: _reviewsEn, ...rootEn } = demoRootOf("en")
        const files = [...demoLocaleFilesOf("vi", root), ...demoLocaleFilesOf("en", rootEn)]
        const result = draftOf("4-first", files)

        expect(result.issues).toEqual([])
        expect(result.draft?.content.workspace).toBeNull()
        expect(result.draft?.content.files).toEqual([])
        expect(result.draft?.content.locales.vi.retrieval).toEqual([])
    })

    it("places a lesson by its own entry before its category and refuses a category with no entry", async () => {
        const { buildLessonDraft: draftOf } = await build()
        const files = demoFilesOf()
        const systemDesign = (path: string, locale: "vi" | "en") =>
            sourceFileOf(path, separatorTextOf({ ...demoRootOf(locale), category: "system-design" }))
        const asSystemDesign = files.map((file) =>
            file.path === "vi.md" || file.path === "en.md"
                ? systemDesign(file.path, file.path === "vi.md" ? "vi" : "en")
                : file,
        )

        expect(draftOf("2-cqrs-read-models", asSystemDesign).draft?.group).toBe("distributed")
        expect(draftOf("2-new-lesson", asSystemDesign)).toEqual({
            draft: null,
            issues: [
                {
                    path: "vi.md",
                    field: "category",
                    message: "lesson new-lesson of category system-design has no group entry",
                },
            ],
        })
    })

    it("places the lesson under its topic and records the content folder its legacy reference names", async () => {
        const { buildLessonDraft: draftOf } = await build()
        const result = draftOf("2-demo-lesson", demoFilesOf())

        expect(result.draft?.topic).toBe("demo-topic")
        expect(result.draft?.topicSource.title).toBe("Demo topic")
        expect(result.draft?.sourceKey).toBe(DEMO_SOURCE_KEY)
    })
})

describe("buildLessonDraft source", () => {
    it("records the content folder the catalog names instead of the legacy reference", async () => {
        const { buildWith: draftOf } = await build()
        const catalog = {
            ...demoTopicCatalogOf(),
            sources: { "demo-lesson": "courses/demo-course/modules/1-b/contents/0-c" },
        }
        const result = draftOf("2-demo-lesson", demoFilesOf(), catalog)

        expect(result.draft?.sourceKey).toBe("courses/demo-course/modules/1-b/contents/0-c")
    })
})

describe("buildLessonDraft topics", () => {
    it.each([
        ["2-stranger", "lesson stranger has no topic entry"],
        ["2-clash", "topic clash of lesson clash is also a lesson id"],
        ["2-looped", "topic demo-lesson of lesson looped is also a lesson id"],
        ["2-lost", "topic lost-topic of lesson lost is not defined"],
    ])("refuses the folder %s with the reason it cannot be placed", async (folder, message) => {
        const { buildLessonDraft: draftOf } = await build()
        const result = draftOf(folder, demoFilesOf())

        expect(result).toEqual({ draft: null, issues: [{ path: "vi.md", field: "topic", message }] })
    })

    it("answers the read issues and no draft when a file cannot be read", async () => {
        const { buildLessonDraft: draftOf } = await build()
        const result = draftOf(
            "2-demo-lesson",
            demoFilesOf().filter((file) => file.path !== "en.md"),
        )

        expect(result.draft).toBeNull()
        expect(result.issues).toEqual([{ path: "en.md", field: "", message: "is missing" }])
    })

    it("answers the validation issues and no draft when ids do not resolve", async () => {
        const { buildLessonDraft: draftOf } = await build()
        const root = separatorTextOf({ ...demoRootOf("vi"), learningOutcomes: [{ id: "other", text: "x" }] })
        const files = demoFilesOf().map((file) => (file.path === "vi.md" ? sourceFileOf("vi.md", root) : file))
        const result = draftOf("2-demo-lesson", files)

        expect(result.draft).toBeNull()
        expect(result.issues[0]?.message).toBe("demo--o1 is not a learning outcome")
    })

    it("names a declared workspace file the folder lacks", async () => {
        const { buildLessonDraft: draftOf } = await build()
        const result = draftOf(
            "2-demo-lesson",
            demoFilesOf().filter((file) => file.path !== "workspace/source.ts"),
        )

        expect(result.draft).toBeNull()
        expect(result.issues).toEqual([
            { path: "vi.md", field: "workspace.files[1].path", message: "workspace/source.ts is not in the folder" },
        ])
    })
})
