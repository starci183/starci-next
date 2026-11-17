import type { LessonView } from "@modules/domain/lesson"
import { lessonChunksOf, lessonChunksWithAccessOf, lessonDocsOf, lessonOf } from "./mcp-lesson.policy"

const view = (partial: Partial<LessonView> = {}): LessonView =>
    ({
        id: "outbox",
        version: "abc1234",
        locale: "en",
        title: "Outbox",
        description: "How to send once",
        overview: "Overview text",
        learningOutcomes: [{ id: "o1", text: "Name the invariant" }],
        prerequisites: [],
        references: [],
        topic: { id: "t", title: "Topic" },
        isPremium: true,
        sections: [
            {
                id: "1-essential",
                phase: "explain",
                title: "Essence",
                locked: false,
                body: "# Essence\n\nSend once. ".concat("w ".repeat(150)),
            },
            { id: "2-source", phase: "explore", title: "Source", locked: true, body: null },
        ],
        essential: {
            isLocked: true,
            lockedParts: ["2-source"],
            opener: [
                {
                    id: "q1",
                    activityId: "opener.q1",
                    prompt: "Why a key?",
                    choices: [
                        { id: "c0", label: "Fast" },
                        { id: "c1", label: "Once" },
                    ],
                    sectionId: null,
                    sectionRef: null,
                    scenarioId: null,
                },
            ],
            source: null,
            invariants: [{ id: "one-effect", text: "One effect" }],
            hiddenInvariants: 3,
            architecture: {
                diagram: "graph TD\nA-->B",
                components: [{ name: "api", port: "3000", role: "writes", invariants: ["one-effect"] }],
            },
            codeWalk: [
                {
                    id: "w1",
                    title: "Claim",
                    invariant: "one-effect",
                    file: "src/claim.ts",
                    line: 9,
                    snippet: "const a = 1",
                    why: "Without it two relays send twice",
                },
            ],
            scenarios: [
                {
                    id: "dup",
                    title: "Duplicate",
                    fault: "send twice",
                    command: "npm test",
                    expected: "one credit",
                    invariant: "one-effect",
                    guards: ["key"],
                    hint: "HINT",
                },
            ],
            challenges: [
                {
                    id: "easy",
                    level: "easy",
                    title: "Easy",
                    brief: "Write the key",
                    rubric: [{ id: "r", criterion: "Keys retries", points: 100, isCritical: true }],
                    hiddenScenarios: 2,
                    questions: [],
                },
            ],
        },
        ...partial,
    }) as unknown as LessonView

describe("lessonDocsOf", () => {
    it("lists the overview, each readable section and every structured part, and never a locked section or a hint", () => {
        const docs = lessonDocsOf(view())
        expect(docs.map((doc) => doc.path)).toEqual([
            "overview",
            "section/1",
            "opener/q1",
            "invariants",
            "architecture",
            "codewalk/w1",
            "scenario/dup",
            "challenge/easy",
        ])
        expect(docs.find((doc) => doc.path === "section/1")?.part).toBe("1-essential")
        expect(docs.find((doc) => doc.path === "scenario/dup")?.part).toBe("3-scenarios")
        const all = JSON.stringify(docs)
        expect(all).not.toContain("HINT")
        expect(all).toContain("```mermaid")
        expect(all).toContain("one credit")
    })

    it("writes the labels in the language of the lesson", () => {
        const text = JSON.stringify(lessonDocsOf(view({ locale: "vi" })))
        expect(text).toContain("Lỗi được bơm")
        expect(text).not.toContain("Injected fault")
    })

    it("has only the overview and sections for a lesson without the four parts", () => {
        expect(lessonDocsOf(view({ essential: null })).map((doc) => doc.path)).toEqual(["overview", "section/1"])
    })
})

describe("lessonOf", () => {
    it("counts the invariants only hidden scenarios judge and never names them", () => {
        const lesson = lessonOf(view(), { part: null, answers: [], redScenarios: new Set() })
        expect(lesson.hiddenInvariants).toBe(3)
        expect(lesson.invariants).toEqual([{ id: "one-effect", text: "One effect" }])
        expect(lessonOf(view(), { part: "1-essential", answers: [], redScenarios: new Set() }).hiddenInvariants).toBe(0)
    })
})

describe("lessonChunksOf and lessonChunksWithAccessOf", () => {
    it("titles each chunk by its document and heading trail and says where to read it", () => {
        const chunks = lessonChunksOf("outbox", lessonDocsOf(view()))
        const essence = chunks.find((chunk) => chunk.path === "section/1")
        expect(essence).toMatchObject({ title: "Essence", line: 1 })
        expect(essence?.context).toBe("outbox/section/1 · Essence")
    })

    it("tags a chunk free when the free reader's documents hold the same document and premium otherwise", () => {
        const all = lessonDocsOf(view())
        const open = all.filter((doc) => doc.part === "1-essential" || doc.part === null)
        const access = new Map(lessonChunksWithAccessOf("outbox", all, open).map((chunk) => [chunk.path, chunk.access]))
        expect(access.get("section/1")).toBe("free")
        expect(access.get("overview")).toBe("free")
        expect(access.get("scenario/dup")).toBe("premium")
        expect(access.get("architecture")).toBe("premium")
    })
})
