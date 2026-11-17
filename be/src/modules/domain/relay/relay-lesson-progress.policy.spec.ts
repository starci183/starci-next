import { Test } from "@nestjs/testing"
import type { LessonEssential } from "@modules/domain/lesson"
import { challengeScoresOf, lessonPartsOf, type LessonProgressFacts } from "./relay-lesson-progress.policy"
import type { LessonScenarioRunView } from "./relay-lesson.service"

const POLICY: unique symbol = Symbol("spec.relay-lesson-progress-policy")
const policy = { challengeScoresOf, lessonPartsOf }

const build = async (): Promise<typeof policy> => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: POLICY, useFactory: () => policy }],
    }).compile()
    return moduleRef.get(POLICY)
}

const question = (id: string) => ({ id, prompt: id, choices: ["a", "b"], correctIndex: 0, explanation: "" })
const guard = { name: "g", env: "G" }
const scenario = (id: string) => ({
    id,
    title: id,
    fault: id,
    command: `run ${id}`,
    expected: "ok",
    invariant: "i",
    guards: [guard],
})
const hidden = (id: string) => ({ id, title: id, command: `run ${id}` })
const rubric = [
    { id: "r1", criterion: "one", points: 40 },
    { id: "r2", criterion: "two", points: 40, isCritical: true },
    { id: "r3", criterion: "essence", points: 20 },
]
const essential: LessonEssential = {
    opener: [question("o1"), question("o2")],
    source: { langs: ["typescript"] },
    invariants: [],
    architecture: null,
    codeWalk: [],
    scenarios: [scenario("s1"), scenario("s2")],
    challenges: [
        {
            id: "c-easy",
            level: "easy",
            title: "e",
            brief: "b",
            rubric,
            hidden: [hidden("h1"), hidden("h2")],
            questions: [question("q1")],
        },
        { id: "c-medium", level: "medium", title: "m", brief: "b", rubric, hidden: [hidden("h3")] },
    ],
}
const run = (
    scenarioId: string,
    status: LessonScenarioRunView["status"],
    extra: Partial<LessonScenarioRunView> = {},
): LessonScenarioRunView => ({
    scenarioId,
    status,
    runId: `run-${scenarioId}`,
    slot: null,
    ref: null,
    exitCode: null,
    durationMs: null,
    commit: null,
    output: null,
    challengeTier: null,
    guardsOff: [],
    concepts: [],
    why: null,
    ledger: null,
    at: "2026-11-17T00:00:00.000Z",
    ...extra,
})
const all = { essence: true, source: true, scenarios: true, apply: true }
const facts = (change: Partial<LessonProgressFacts>): LessonProgressFacts => ({
    essential,
    openerAnswered: 0,
    readable: all,
    runs: [],
    hasEvents: false,
    choices: new Map(),
    ...change,
})

describe("lesson parts progress", () => {
    it("starts every part at none and resumes Bản chất", async () => {
        const { lessonPartsOf: parts } = await build()

        const result = parts(facts({}))

        expect(result.parts.map((part) => part.state)).toEqual(["none", "none", "none", "none"])
        expect(result.inProgressPart).toBe("essence")
    })

    it("counts the opener, the pulled source, the green scenarios and the passed rungs, and resumes the first part not done", async () => {
        const { lessonPartsOf: parts } = await build()
        const runs = [
            run("s1", "passed"),
            run("s2", "failed"),
            run("h1", "passed", { slot: "challenge" }),
            run("h2", "passed", { slot: "challenge" }),
        ]

        const result = parts(facts({ openerAnswered: 2, hasEvents: true, runs }))

        expect(result.parts).toEqual([
            { part: "essence", state: "done", done: 2, total: 2 },
            { part: "source", state: "done", done: 1, total: 1 },
            { part: "scenarios", state: "doing", done: 1, total: 2 },
            { part: "apply", state: "doing", done: 1, total: 2 },
        ])
        expect(result.inProgressPart).toBe("scenarios")
    })

    it("reports a part the learner may not read as locked, with its total and nothing done, and never resumes it", async () => {
        const { lessonPartsOf: parts } = await build()

        const result = parts(
            facts({ openerAnswered: 2, readable: { ...all, source: false, scenarios: false, apply: false } }),
        )

        expect(result.parts.map((part) => part.state)).toEqual(["done", "locked", "locked", "locked"])
        expect(result.parts[2]).toMatchObject({ done: 0, total: 2 })
        expect(result.inProgressPart).toBeNull()
    })

    it("does not count a green run with a guard switched off", async () => {
        const { lessonPartsOf: parts } = await build()

        const result = parts(facts({ runs: [run("s1", "passed", { guardsOff: ["g"] })] }))

        expect(result.parts[2]).toMatchObject({ state: "doing", done: 0 })
    })
})

describe("challenge scores", () => {
    it("scores a rung by criterion, maps the essence check to the last criterion and leaves the next rung locked", async () => {
        const { challengeScoresOf: scores } = await build()
        const runs = [run("h1", "passed", { slot: "challenge" }), run("h2", "failed", { slot: "challenge" })]

        const [easy, medium] = scores(essential, runs, new Map([["challenge.c-easy.q1", true]]))

        expect(easy).toMatchObject({ state: "doing", isLocked: false, isPassed: false, unlocksNext: false, score: 60 })
        expect(easy?.criteria.map((criterion) => [criterion.id, criterion.passed])).toEqual([
            ["r1", true],
            ["r2", false],
            ["r3", true],
        ])
        expect(easy?.isCriticalMet).toBe(false)
        expect(medium).toMatchObject({ state: "locked", isLocked: true })
    })

    it("opens the next rung only when every hidden scenario of the tier below is green", async () => {
        const { challengeScoresOf: scores } = await build()
        const runs = [run("h1", "passed", { slot: "challenge" }), run("h2", "passed", { slot: "challenge" })]

        const [easy, medium] = scores(essential, runs, new Map())

        expect(easy).toMatchObject({
            state: "passed",
            isPassed: true,
            unlocksNext: true,
            hiddenGreen: 2,
            hiddenTotal: 2,
            score: 80,
        })
        expect(medium).toMatchObject({ state: "open", isLocked: false, score: 0 })
    })
})
