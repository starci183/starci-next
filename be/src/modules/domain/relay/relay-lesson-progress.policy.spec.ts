import { Test } from "@nestjs/testing"
import type { LessonEssential } from "@modules/domain/lesson"
import { challengeScoresOf, lessonPartsOf, type LessonProgressFacts } from "./relay-lesson-progress.policy"
import { bugHintKeyOf, bugResultsOf, isBugHintKey, isFinalOpenOf, nextBugHintOf } from "./relay-lesson-bugs.policy"
import { lessonManifestOf } from "./relay-lesson-manifest.policy"
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
    received: null,
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

describe("the Tìm sạn bug pack, per test id", () => {
    const bugTest = (id: string, isFinal = false) => ({
        id,
        command: `npm test -- --scenario ${id}`,
        essence: null,
        title: id,
        pass: `PASS ${id}`,
        fail: `FAIL ${id}`,
        expected: "1",
        received: "n",
        hints: [`H1 ${id}`, `H2 ${id}`, `H3 ${id}`],
        isFinal,
        concepts: [],
    })
    const pack = { tests: [bugTest("happy-path"), bugTest("ack-lost-retry"), bugTest("ledger-under-chaos", true)] }
    const withBugs: LessonEssential = { ...essential, bugs: pack }
    const bugRun = (id: string, status: LessonScenarioRunView["status"], received: string | null = null) =>
        run(`bug:${id}`, status, { slot: "bugs", received })

    it("releases pass after a green run, fail and the received line after a red one, nothing before a run", () => {
        const results = bugResultsOf(
            pack,
            [bugRun("happy-path", "passed"), bugRun("ack-lost-retry", "failed", "points 998")],
            new Set(),
        )
        expect(results[0]).toMatchObject({
            testId: "happy-path",
            status: "passed",
            pass: "PASS happy-path",
            fail: null,
        })
        expect(results[1]).toMatchObject({
            status: "failed",
            pass: null,
            fail: "FAIL ack-lost-retry",
            received: "points 998",
            hints: [],
            hintsOpened: 0,
            hintCount: 3,
        })
        expect(results[2]).toMatchObject({ status: "none", isLocked: true, pass: null, fail: null, hints: [] })
    })

    it("opens the hints one at a time while the test is red, and never past the last", () => {
        const runs = [bugRun("ack-lost-retry", "failed")]
        expect(nextBugHintOf(pack, "ack-lost-retry", runs, new Set())).toEqual({ kind: "open", level: 1 })
        const two = new Set([bugHintKeyOf("ack-lost-retry", 1), bugHintKeyOf("ack-lost-retry", 2)])
        expect(nextBugHintOf(pack, "ack-lost-retry", runs, two)).toEqual({ kind: "open", level: 3 })
        expect(bugResultsOf(pack, runs, two)[1]?.hints).toEqual(["H1 ack-lost-retry", "H2 ack-lost-retry"])
        const all = new Set([...two, bugHintKeyOf("ack-lost-retry", 3)])
        expect(nextBugHintOf(pack, "ack-lost-retry", runs, all)).toEqual({ kind: "none-left" })
        expect(nextBugHintOf(pack, "happy-path", [bugRun("happy-path", "passed")], new Set())).toEqual({
            kind: "not-red",
        })
        expect(nextBugHintOf(pack, "nope", runs, new Set())).toEqual({ kind: "unknown" })
        expect(isBugHintKey(bugHintKeyOf("ack-lost-retry", 2))).toBe(true)
        expect(isBugHintKey("happy-path")).toBe(false)
    })

    it("opens the final test once every other test is green, and shows its run only then", () => {
        const green = [bugRun("happy-path", "passed"), bugRun("ack-lost-retry", "passed")]
        expect(isFinalOpenOf(pack, green)).toBe(true)
        const results = bugResultsOf(pack, [...green, bugRun("ledger-under-chaos", "failed")], new Set())
        expect(results[2]).toMatchObject({ isLocked: false, status: "failed", fail: "FAIL ledger-under-chaos" })
        const early = bugResultsOf(pack, [bugRun("ledger-under-chaos", "passed")], new Set())
        expect(early[2]).toMatchObject({ isLocked: true, status: "none", pass: null })
    })

    it("keeps the first rung of Challenges locked until the whole bug pack is green, and counts Tìm sạn by test", () => {
        const half = [bugRun("happy-path", "passed"), bugRun("ack-lost-retry", "passed")]
        expect(challengeScoresOf(withBugs, half, new Map())[0]).toMatchObject({ level: "easy", isLocked: true })
        const all = [...half, bugRun("ledger-under-chaos", "passed")]
        expect(challengeScoresOf(withBugs, all, new Map())[0]).toMatchObject({ level: "easy", isLocked: false })
        const { parts } = lessonPartsOf({
            essential: withBugs,
            openerAnswered: 0,
            readable: { essence: true, source: true, scenarios: true, apply: true },
            runs: half,
            hasEvents: true,
            choices: new Map(),
        })
        expect(parts.find((part) => part.part === "scenarios")).toMatchObject({ done: 2, total: 3, state: "doing" })
    })

    it("signs the bug pack only when asked, the final test only once it is open", () => {
        const link = { url: "/api/relay/lessons/outbox/source.tgz", sha256: "a".repeat(64), commit: "b".repeat(40) }
        const bugsLink = { ...link, url: "/api/relay/lessons/outbox/bugs.tgz" }
        const closed = lessonManifestOf("outbox", withBugs, { bugs: true }, () => true, link, {
            link: bugsLink,
            isFinalOpen: false,
        })
        expect(closed.kind === "section" ? closed.lesson.bugs?.tests.map((test) => test.id) : null).toEqual([
            "happy-path",
            "ack-lost-retry",
        ])
        const open = lessonManifestOf("outbox", withBugs, { bugs: true }, () => true, link, {
            link: bugsLink,
            isFinalOpen: true,
        })
        expect(open.kind === "section" ? open.lesson.bugs : null).toMatchObject({
            source: bugsLink,
            tests: [{ id: "happy-path" }, { id: "ack-lost-retry" }, { id: "ledger-under-chaos" }],
        })
        const plain = lessonManifestOf("outbox", withBugs, {}, () => true, link)
        expect(plain.kind === "section" ? plain.lesson.bugs : "x").toBeUndefined()
        expect(
            lessonManifestOf("outbox", essential, { bugs: true }, () => true, link, {
                link: bugsLink,
                isFinalOpen: true,
            }),
        ).toEqual({ kind: "not-runnable" })
        expect(JSON.stringify(open)).not.toContain("PASS ")
        expect(JSON.stringify(open)).not.toContain("H1 ")
    })

    it("signs a seeded lesson whose version is a 12-character content label, pinned as a 40 hex commit", () => {
        const link = { url: "/api/relay/lessons/outbox/source.tgz", sha256: "a".repeat(64), commit: "cc4ea4e750aa" }
        const bugsLink = { ...link, url: "/api/relay/lessons/outbox/bugs.tgz" }
        const signed = lessonManifestOf("outbox", withBugs, { bugs: true }, () => true, link, {
            link: bugsLink,
            isFinalOpen: false,
        })
        expect(signed.kind).toBe("section")
        if (signed.kind !== "section") return
        expect(signed.lesson.source.commit).toMatch(/^[0-9a-f]{40}$/u)
        expect(signed.lesson.bugs?.source.commit).toBe(signed.lesson.source.commit)
        expect(lessonManifestOf("outbox", withBugs, {}, () => true, link)).toMatchObject({ kind: "section" })
    })
})
