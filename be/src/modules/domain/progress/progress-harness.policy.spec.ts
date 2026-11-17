import { Test } from "@nestjs/testing"
import { buildHarness, buildStateOf, doctorVerdictOf } from "./progress-harness.policy"
import type { HarnessSource } from "./progress.contracts"

/** The functions under test, provided the way Nest provides them so the spec builds its subject from a testing module. */
const SUBJECT = { buildHarness, buildStateOf, doctorVerdictOf }

/** The token the testing module provides the functions under. */
const SUBJECT_TOKEN: unique symbol = Symbol("progress.harness-policy")

/** Builds the functions under test from a testing module. */
const loadSubject = async (): Promise<typeof SUBJECT> => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: SUBJECT_TOKEN, useFactory: () => SUBJECT }],
    }).compile()
    return moduleRef.get<typeof SUBJECT>(SUBJECT_TOKEN)
}

const SOURCE: HarnessSource = {
    builds: [
        {
            id: "agent-cli",
            title: "Agent CLI",
            stages: [
                { id: "s1", title: "Loop", state: "proved" },
                { id: "s2", title: "Tools", state: "proved" },
            ],
        },
        {
            id: "mcp-server",
            title: "MCP",
            stages: [
                { id: "s1", title: "Tools", state: "practising" },
                { id: "s2", title: "Auth", state: "none" },
            ],
        },
        { id: "lead-agent", title: "Lead", stages: [{ id: "s1", title: "Search", state: "none" }] },
    ],
    doctor: [
        { tool: "claude", passed: 3, total: 4, failed: 1 },
        { tool: "codex", passed: 4, total: 4, failed: 0 },
        { tool: "other", passed: 0, total: 4, failed: 0 },
    ],
    trials: [
        { trap: "t1", title: "Red tests", last: { tool: "claude", verdict: "held", at: "2026-11-15T00:00:00.000Z" } },
        { trap: "t2", title: "Secret", last: null },
    ],
    events: [],
}

describe("buildStateOf", () => {
    it("is proved only when every stage is proved, practising when any has a result, else none", async () => {
        const { buildStateOf: stateOf } = await loadSubject()

        expect(stateOf(SOURCE.builds[0]?.stages ?? [])).toBe("proved")
        expect(stateOf(SOURCE.builds[1]?.stages ?? [])).toBe("practising")
        expect(stateOf(SOURCE.builds[2]?.stages ?? [])).toBe("none")
        expect(stateOf([])).toBe("none")
    })
})

describe("doctorVerdictOf", () => {
    it("fails when any probe failed, passes when all passed and is not run otherwise", async () => {
        const { doctorVerdictOf: verdictOf } = await loadSubject()

        expect(verdictOf({ tool: "claude", passed: 3, total: 4, failed: 1 })).toBe("failed")
        expect(verdictOf({ tool: "codex", passed: 4, total: 4, failed: 0 })).toBe("passed")
        expect(verdictOf({ tool: "x", passed: 0, total: 4, failed: 0 })).toBe("not-run")
        expect(verdictOf({ tool: "x", passed: 0, total: 0, failed: 0 })).toBe("not-run")
    })
})

describe("buildHarness", () => {
    it("counts the builds done and words each stage, doctor tool and trial", async () => {
        const { buildHarness: build } = await loadSubject()

        const view = build(SOURCE)

        expect(view).toMatchObject({ buildsDone: 1, buildsTotal: 3 })
        expect(view.builds[1]).toMatchObject({
            state: "practising",
            stagesProved: 0,
            stagesPractising: 1,
            stagesTotal: 2,
        })
        expect(view.doctor.map((doctor) => doctor.verdict)).toEqual(["failed", "passed", "not-run"])
        expect(view.trials).toEqual([
            { trap: "t1", title: "Red tests", tool: "claude", verdict: "held", at: "2026-11-15T00:00:00.000Z" },
            { trap: "t2", title: "Secret", tool: null, verdict: null, at: null },
        ])
    })
})
