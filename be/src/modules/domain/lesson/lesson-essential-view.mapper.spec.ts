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
const FOUR_PARTS: ReadonlyArray<[string, LessonPhase]> = [
    ["1-essential", "explain"],
    ["2-source", "explore"],
    ["3-scenarios", "apply"],
    ["4-apply", "reflect"],
]

const fourPartRow = (phases: ReadonlyArray<[string, LessonPhase]> = FOUR_PARTS): VersionRow => {
    const content = demoContentOf()
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
const ALL = ["1-essential", "2-source", "3-scenarios", "4-apply", "5-patterns"] as const

describe("toEssentialView by part", () => {
    it("gives a free learner the opener and names the other three parts locked, with none of their payload", () => {
        const view = toEssentialView(ESSENTIAL, FREE)
        expect(view).toMatchObject({
            isLocked: true,
            lockedParts: ["2-source", "3-scenarios", "4-apply", "5-patterns"],
        })
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
        expect(view?.lockedParts).toEqual(["2-source", "4-apply", "5-patterns"])
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
        expect(view.essential?.lockedParts).toEqual(["2-source", "3-scenarios", "4-apply", "5-patterns"])
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

describe("toEssentialView of a story-driven opener", () => {
    const STORY: LessonEssential = {
        ...ESSENTIAL,
        story: { title: "Black Friday", body: "The gateway slows down." },
        opener: [
            {
                id: "q1",
                prompt: "Q1?",
                choices: ["a", "b"],
                correctIndex: 1,
                explanation: "RIGHT-ANSWER-WHY",
                choiceExplanations: ["WRONG-OPTION-WHY", "RIGHT-ANSWER-WHY"],
                sectionId: "1-essential",
                event: { at: "21:03", text: "Retries double the load" },
                insight: { essence: "INSIGHT-ESSENCE", why: "INSIGHT-WHY", interview: "INSIGHT-INTERVIEW" },
            },
        ],
    }

    it("shows the story and the event of each question, and none of the answer key or the insight", () => {
        const view = toEssentialView(STORY, FREE)

        expect(view?.story).toEqual({
            title: "Black Friday",
            body: "The gateway slows down.",
            company: "",
            facts: [],
            system: null,
            glossary: [],
        })
        expect(view?.opener[0]?.event).toEqual({ at: "21:03", text: "Retries double the load" })
        const text = JSON.stringify(view)
        for (const secret of [
            "RIGHT-ANSWER-WHY",
            "WRONG-OPTION-WHY",
            "INSIGHT-ESSENCE",
            "INSIGHT-WHY",
            "INSIGHT-INTERVIEW",
            "correctIndex",
        ])
            expect(text).not.toContain(secret)
    })

    it("answers no story and no event for a lesson written before them, and no story while the opener is locked", () => {
        expect(toEssentialView(ESSENTIAL, FREE)).toMatchObject({ story: null, opener: [{ event: null }] })
        expect(toEssentialView(STORY, [])?.story).toBeNull()
    })
})

describe("toEssentialView of the five parts", () => {
    const test = (id: string, isFinal = false) => ({
        id,
        command: `npm test -- --scenario ${id}`,
        essence: isFinal ? null : "q1",
        title: `T ${id}`,
        pass: `PASS-SECRET-${id}`,
        fail: `FAIL-SECRET-${id}`,
        expected: "points 499",
        received: "points",
        hints: [`HINT-1-${id}`, `HINT-2-${id}`, `HINT-3-${id}`],
        isFinal,
    })
    const FIVE: LessonEssential = {
        ...ESSENTIAL,
        challenges: [
            {
                id: "hard",
                level: "hard",
                title: "H",
                brief: "B",
                rubric: [],
                questions: [
                    {
                        id: "e1",
                        prompt: "Why?",
                        choices: ["right", "wrong"],
                        correctIndex: 0,
                        explanation: "",
                        writtenRequired: true,
                    },
                    { id: "e2", prompt: "How?", choices: ["right", "wrong"], correctIndex: 0, explanation: "" },
                ],
                writtenRequired: true,
            },
        ],
        bugs: { tests: [test("bug-1"), test("ledger-under-chaos", true)] },
        patterns: [
            {
                stack: "nestjs",
                status: "ready",
                repo: "starci183/patterns-demo",
                path: "saga/src/modules/platform/event-bus",
                where: "W",
                howFar: "H",
                whenDown: "D",
                files: [{ path: "event-bus.service.ts", note: "publish()" }],
                snippet: { lang: "ts", file: "x.ts", code: "publish()" },
            },
        ],
    }

    it("lists the bug-pack tests by name and command, never their pass and fail texts or hints", () => {
        const view = toEssentialView(FIVE, ALL)
        expect(view?.bugs?.tests).toEqual([
            {
                id: "bug-1",
                title: "T bug-1",
                essence: "q1",
                command: "npm test -- --scenario bug-1",
                expected: "points 499",
                received: "points",
                hintCount: 3,
                isFinal: false,
            },
            expect.objectContaining({ id: "ledger-under-chaos", isFinal: true }),
        ])
        const text = JSON.stringify(view)
        expect(text).not.toContain("PASS-SECRET")
        expect(text).not.toContain("FAIL-SECRET")
        expect(text).not.toContain("HINT-")
    })

    it("sends no bug pack and no pattern to a reader who may not read those parts", () => {
        const view = toEssentialView(FIVE, FREE)
        expect(view).toMatchObject({ bugs: null, patterns: [], challenges: [] })
        expect(view?.lockedParts).toEqual(["2-source", "3-scenarios", "4-apply", "5-patterns"])
    })

    it("links a Pattern stack to its folder on GitHub", () => {
        expect(toEssentialView(FIVE, ALL)?.patterns[0]).toMatchObject({
            stack: "nestjs",
            url: "https://github.com/starci183/patterns-demo/tree/HEAD/saga/src/modules/platform/event-bus",
            files: [{ path: "event-bus.service.ts", note: "publish()" }],
        })
    })

    it("marks a tier that asks a written explanation, and never sends the right choice", () => {
        const [hard] = toEssentialView(FIVE, ALL)?.challenges ?? []
        expect(hard?.writtenRequired).toBe(true)
        expect(hard?.questions.map((question) => question.writtenActivityId)).toEqual([
            "challenge.hard.e1.written",
            null,
        ])
        expect(JSON.stringify(hard)).not.toContain("correctIndex")
    })

    it("reads the Bản chất section under the Bản chất part: locked to its title without Premium", () => {
        const row = fourPartRow([
            ["1-essential", "explain"],
            ["2-essence", "explore"],
        ])
        const free = toLessonView(row, "vi", false, FREE)
        expect(free.sections.find((section) => section.id === "2-essence")).toMatchObject({ locked: true, body: null })
        const premium = toLessonView(row, "vi", true, ALL)
        expect(premium.sections.find((section) => section.id === "2-essence")?.body).toBe("2-essence BODY")
    })
})
