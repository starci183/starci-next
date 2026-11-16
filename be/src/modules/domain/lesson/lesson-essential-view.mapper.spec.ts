import { demoContentOf } from "@tests/fixtures/builders/lesson.builder"
import type { LessonLocaleDocument, LessonPhase } from "./lesson.contracts"
import type { LessonEssential } from "./lesson-essential.contracts"
import { toEssentialView } from "./lesson-essential-view.mapper"
import { toLessonView } from "./lesson-view.mapper"
import type { VersionRow } from "./persistence/lesson.rows"

const ESSENTIAL: LessonEssential = {
    opener: [
        {
            id: "q1",
            prompt: "Q1?",
            choices: ["a", "b"],
            correctIndex: 1,
            explanation: "RIGHT-ANSWER-WHY",
            sectionId: "1-essential",
        },
    ],
    source: { langs: ["typescript"] },
    invariants: [{ id: "effect-once", text: "One effect" }],
    architecture: { diagram: "graph TD", components: [{ name: "api", invariants: ["effect-once"] }] },
    codeWalk: [
        { id: "w1", title: "T", invariant: "effect-once", file: "src/a.ts", line: 3, snippet: "SOURCE-SNIPPET" },
    ],
    scenarios: [
        {
            id: "happy-path",
            title: "Happy",
            fault: "none",
            command: "npm test -- --scenario happy-path",
            expected: "EXPECTED-OUTPUT",
            invariant: "effect-once",
            guards: [{ name: "outbox", env: "GUARD_OUTBOX" }],
        },
    ],
    challenges: [
        {
            id: "easy",
            level: "easy",
            title: "Easy",
            brief: "CHALLENGE-BRIEF",
            rubric: [{ id: "r", criterion: "RUBRIC", points: 100, isCritical: true }],
            hidden: [{ id: "h-easy", title: "H", brief: "H", concepts: [], command: "npm test -- --scenario h-easy" }],
            questions: [{ id: "e1", prompt: "E?", choices: ["a", "b"], correctIndex: 0, explanation: "" }],
        },
    ],
}

/** A four-part lesson row: the article and the three other parts are sections named by their part id. */
const fourPartRow = (): VersionRow => {
    const content = demoContentOf()
    const phases: ReadonlyArray<[string, LessonPhase]> = [
        ["1-essential", "explain"],
        ["2-source", "explore"],
        ["3-scenarios", "apply"],
        ["4-apply", "reflect"],
    ]
    const document = (locale: "vi" | "en"): LessonLocaleDocument => ({
        ...content.locales[locale],
        isPremium: true, // the lesson root says Premium: the parts, not this mark, decide
        sections: phases.map(([id, phase], index) => ({
            id,
            title: `${id} title`,
            phase,
            sortIndex: index + 1,
            body: `${id} BODY`,
        })),
        essential: ESSENTIAL,
    })
    return {
        lesson_id: "outbox",
        version: "v1",
        category: "backend",
        lesson_group: "backend",
        topic: "api-reliability",
        topic_title: "API reliability",
        difficulty: "advanced",
        minutes_read: 40,
        implementation: "typescript",
        content: { ...content, locales: { vi: document("vi"), en: document("en") } },
    }
}

const FREE = ["1-essential"] as const
const ALL = ["1-essential", "2-source", "3-scenarios", "4-apply"] as const

describe("toEssentialView by part", () => {
    it("gives a free learner the opener and names the other three parts locked, with none of their payload", () => {
        const view = toEssentialView(ESSENTIAL, FREE)
        expect(view).toMatchObject({ isLocked: true, lockedParts: ["2-source", "3-scenarios", "4-apply"] })
        expect(view?.opener).toHaveLength(1)
        expect(view).toMatchObject({
            source: null,
            architecture: null,
            invariants: [],
            codeWalk: [],
            scenarios: [],
            challenges: [],
        })
        const text = JSON.stringify(view)
        for (const secret of ["SOURCE-SNIPPET", "EXPECTED-OUTPUT", "CHALLENGE-BRIEF", "RUBRIC", "RIGHT-ANSWER-WHY"])
            expect(text).not.toContain(secret)
    })

    it("fills every part for a Premium learner and keeps the answer key out", () => {
        const view = toEssentialView(ESSENTIAL, ALL)
        expect(view).toMatchObject({ isLocked: false, lockedParts: [] })
        expect(view?.scenarios[0]).toMatchObject({
            id: "happy-path",
            expected: "EXPECTED-OUTPUT",
            invariant: "effect-once",
        })
        expect(view?.codeWalk).toHaveLength(1)
        expect(view?.challenges[0]?.hiddenScenarios).toBe(1)
        expect(JSON.stringify(view)).not.toContain("RIGHT-ANSWER-WHY")
    })

    it("follows the setting: a part the app leaves free opens for everyone, the rest stays locked", () => {
        const view = toEssentialView(ESSENTIAL, ["1-essential", "3-scenarios"])
        expect(view?.lockedParts).toEqual(["2-source", "4-apply"])
        expect(view?.scenarios).toHaveLength(1)
        expect(view?.invariants).toHaveLength(1) // the rules ride with Kịch bản too
        expect(view?.codeWalk).toEqual([])
        expect(view?.challenges).toEqual([])
    })

    it("hides the opener too when the app leaves no part free", () => {
        const view = toEssentialView(ESSENTIAL, [])
        expect(view?.opener).toEqual([])
        expect(view?.lockedParts).toEqual(ALL)
    })

    it("is null for a lesson written before the four parts", () => {
        expect(toEssentialView(undefined, ALL)).toBeNull()
    })
})

describe("toLessonView of a four-part lesson", () => {
    it("gives a free learner the article and locks Source, Kịch bản and Tự áp dụng to their titles", () => {
        const view = toLessonView(fourPartRow(), "vi", false)
        expect(view.sections.map((section) => [section.id, section.locked, section.body])).toEqual([
            ["1-essential", false, "1-essential BODY"],
            ["2-source", true, null],
            ["3-scenarios", true, null],
            ["4-apply", true, null],
        ])
        expect(view.essential?.lockedParts).toEqual(["2-source", "3-scenarios", "4-apply"])
        expect(view.essential?.opener).toHaveLength(1)
        expect(JSON.stringify(view)).not.toContain("2-source BODY")
    })

    it("opens every section for Premium, whatever the lesson root mark says", () => {
        const view = toLessonView(fourPartRow(), "vi", true)
        expect(view.sections.every((section) => !section.locked && section.body !== null)).toBe(true)
    })

    it("opens the parts the setting names for a free learner", () => {
        const view = toLessonView(fourPartRow(), "vi", false, ["1-essential", "2-source"])
        expect(view.sections.map((section) => section.locked)).toEqual([false, false, true, true])
        expect(view.essential?.codeWalk).toHaveLength(1)
    })
})
