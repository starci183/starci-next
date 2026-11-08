import { builder } from "@starci/jest-preset"
import { Test } from "@nestjs/testing"
import { SECRET, demoContentOf } from "@tests/fixtures/builders/lesson.builder"
import type { CatalogRow, VersionRow } from "./persistence/lesson.rows"
import type { LessonContent } from "./lesson.contracts"
import { toCatalogItem, toLessonView } from "./lesson-view.mapper"

const MAPPER: unique symbol = Symbol("lesson.view-mapper")
const mappers = { toCatalogItem, toLessonView }

const build = async (): Promise<typeof mappers> => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: MAPPER, useFactory: () => mappers }],
    }).compile()
    return moduleRef.get<typeof mappers>(MAPPER)
}

const versionRowOf = builder<VersionRow>({
    lesson_id: "demo-lesson",
    version: "v1",
    category: "system-design",
    lesson_group: "distributed",
    topic: "communication-patterns",
    topic_title: "Communication patterns",
    difficulty: "intermediate",
    minutes_read: 95,
    implementation: "typescript",
    content: demoContentOf(),
})

const catalogRowOf = builder<CatalogRow>({
    lesson_id: "demo-lesson",
    version: "v1",
    category: "system-design",
    lesson_group: "distributed",
    topic: "communication-patterns",
    topic_title: "Communication patterns",
    difficulty: "intermediate",
    minutes_read: 95,
    implementation: "typescript",
    title: "A title",
    description: "A description",
})

/** The demo content with one section of the vi locale replaced. */
const withSection = (
    id: string,
    change: (section: LessonContent["locales"]["vi"]["sections"][number]) => object,
): LessonContent => {
    const content = demoContentOf()
    const sections = content.locales.vi.sections.map((section) =>
        section.id === id ? { ...section, ...change(section) } : section,
    )
    return { ...content, locales: { ...content.locales, vi: { ...content.locales.vi, sections } } }
}

describe("toCatalogItem", () => {
    it("lists the lesson with its implementation language and no provider", async () => {
        const { toCatalogItem: toItem } = await build()

        expect(toItem(catalogRowOf())).toEqual({
            id: "demo-lesson",
            version: "v1",
            title: "A title",
            description: "A description",
            category: "system-design",
            group: "distributed",
            topic: { id: "communication-patterns", title: "Communication patterns" },
            difficulty: "intermediate",
            minutes: 95,
            languages: ["typescript"],
            providers: [],
        })
    })

    it("lists no language for a concept that is language-agnostic", async () => {
        const { toCatalogItem: toItem } = await build()

        expect(toItem(catalogRowOf({ implementation: "agnostic" })).languages).toEqual([])
    })
})

describe("toLessonView for a learner with Premium", () => {
    it("opens every section with its body and its activities", async () => {
        const { toLessonView: toView } = await build()
        const view = toView(versionRowOf(), "en", true)

        expect(view).toMatchObject({
            id: "demo-lesson",
            version: "v1",
            locale: "en",
            title: "en: Demo lesson",
            overview: "en: Overview",
            isPremium: true,
            minutes: 95,
            implementation: "typescript",
        })
        expect(view.sections.map((section) => [section.phase, section.locked, section.body === null])).toEqual([
            ["challenge", false, false],
            ["predict", false, false],
            ["explore", false, false],
            ["explain", false, false],
            ["apply", false, false],
            ["reflect", false, false],
        ])
        expect(view.sections[3]?.activities).toEqual([])
    })

    it("hands over the lab workspace with the commands the concept declares and null for the others", async () => {
        const { toLessonView: toView } = await build()

        expect(toView(versionRowOf(), "vi", true).workspace).toEqual({
            runtime: "Node.js 24",
            commands: { windows: "node --test workspace/source.test.ts", unix: null },
            files: [
                { path: "workspace/source.test.ts", role: "test", content: "export const test = 1\n" },
                { path: "workspace/source.ts", role: "source", content: "export const source = 1\n" },
            ],
        })
    })

    it("hands over a Unix-only command with no Windows one", async () => {
        const { toLessonView: toView } = await build()
        const base = demoContentOf()
        const commands = { unix: "u" }
        const content = { ...base, workspace: base.workspace ? { ...base.workspace, commands } : null }

        expect(toView(versionRowOf({ content }), "vi", true).workspace?.commands).toEqual({ windows: null, unix: "u" })
    })

    it("hands over no workspace for a concept without one", async () => {
        const { toLessonView: toView } = await build()
        const content = { ...demoContentOf(), workspace: null }

        expect(toView(versionRowOf({ content }), "vi", true).workspace).toBeNull()
    })
})

describe("toLessonView activities", () => {
    it("shows each kind of activity by its public fields only", async () => {
        const { toLessonView: toView } = await build()
        const sections = toView(versionRowOf(), "vi", true).sections
        const [interview, predict, explore, , practice] = sections.map((section) => section.activities[0])

        expect(interview).toEqual({
            id: "demo--interview",
            kind: "explain",
            prompt: "vi: Explain how a read model goes stale.",
            responseKind: "written-explanation",
            evaluationMethod: "ai-rubric",
            isDiagnostic: true,
            outcomeIds: ["demo--o1", "demo--o2"],
            criteria: [
                { id: "demo--interview--c1", criterion: "vi: Mechanism", maxScore: 2 },
                { id: "demo--interview--c2", criterion: "vi: Limits", maxScore: 3 },
            ],
            options: [],
            simulation: null,
            exercise: null,
        })
        expect(predict?.options).toEqual([
            { id: "demo--predict--1", label: "vi: The old name" },
            { id: "demo--predict--2", label: "vi: The new name" },
            { id: "demo--predict--3", label: "vi: An error" },
        ])
        expect(explore).toMatchObject({ responseKind: null, evaluationMethod: null, isDiagnostic: false, criteria: [] })
        expect(explore?.simulation?.transitions).toHaveLength(2)
        expect(explore?.simulation?.states.map((state) => state.isSuccess)).toEqual([false, false, true])
        expect(practice?.exercise).toEqual({
            submissionInstructions: "vi: Submit the log.",
            files: [
                {
                    relativePath: "source.ts",
                    role: "reference",
                    syntaxLanguage: "typescript",
                    content: "export const a = 1",
                },
            ],
        })
    })

    it("shows an exercise that hands over no file and a reference without an address", async () => {
        const { toLessonView: toView } = await build()
        const bare = { submissionInstructions: "s", verificationMode: "reasoning" }
        const content = withSection("4-practice", (section) => ({
            activities: (section.activities ?? []).map((activity) => ({ ...activity, exercise: bare })),
        }))
        const view = toView(versionRowOf({ content }), "vi", true)

        expect(view.sections[4]?.activities[0]?.exercise).toEqual({ submissionInstructions: "s", files: [] })
        expect(view.references.map((reference) => reference.url)).toEqual(["https://example.test/docs", null])
    })
})

describe("toLessonView for a learner without Premium", () => {
    it("opens the overview and the challenge phase and locks every other phase to its title", async () => {
        const { toLessonView: toView } = await build()
        const view = toView(versionRowOf(), "vi", false)

        expect(view.isPremium).toBe(false)
        expect(view.overview).toBe("vi: Overview")
        expect(view.sections.map((section) => [section.phase, section.locked])).toEqual([
            ["challenge", false],
            ["predict", true],
            ["explore", true],
            ["explain", true],
            ["apply", true],
            ["reflect", true],
        ])
        expect(view.sections[0]?.activities).toHaveLength(1)
        expect(view.sections[1]).toEqual({
            id: "1-prediction",
            sortIndex: 1,
            phase: "predict",
            title: "vi: Section 1-prediction",
            locked: true,
            body: null,
            activities: [],
        })
        expect(view.workspace).toBeNull()
    })
})

describe("toLessonView projection", () => {
    it.each([true, false])(
        "never carries an answer, evidence, correctness, explanation or hint (premium %s)",
        async (premium) => {
            const { toLessonView: toView } = await build()
            const json = JSON.stringify(toView(versionRowOf(), "vi", premium))

            expect(json).not.toContain(SECRET)
            expect(json).not.toContain("isCorrect")
            expect(json).not.toContain("expectedEvidence")
            expect(json).not.toContain("misconception")
            expect(json).not.toContain("sampleAnswer")
            expect(json).not.toContain("hints")
        },
    )

    it("copies only the listed fields, so a field added to the stored content stays private", async () => {
        const { toLessonView: toView } = await build()
        const content = withSection("0-interview", (section) => ({
            activities: (section.activities ?? []).map((activity) => ({ ...activity, futureField: SECRET })),
        }))

        expect(JSON.stringify(toView(versionRowOf({ content }), "vi", true))).not.toContain(SECRET)
    })
})
