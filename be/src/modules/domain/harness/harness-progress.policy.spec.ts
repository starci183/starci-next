import { Test } from "@nestjs/testing"
import type { HarnessProofRow, HarnessRunRow } from "./harness.contracts"
import {
    buildViewOf,
    hubOf,
    probeResultOf,
    rolledState,
    trialResultOf,
    type StoredBuild,
} from "./harness-progress.policy"

const POLICY = Symbol("harness-progress-policy")

const policies = { buildViewOf, hubOf, probeResultOf, rolledState, trialResultOf }

const build = async (): Promise<typeof policies> => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: POLICY, useFactory: () => policies }],
    }).compile()
    return moduleRef.get<typeof policies>(POLICY)
}

const BOUND = { repository: "learner/agent", bindingId: "b1" }

const BUILD: StoredBuild = {
    id: "agent-cli",
    order: 1,
    title: { vi: "Agent dong lenh", en: "Agent CLI" },
    summary: { vi: "tom tat", en: "summary" },
    keys: [{ id: "llm", anyOf: ["ANTHROPIC_API_KEY"], note: null }],
    runtime: { dir: "source", install: "npm ci", e2e: "npm run e2e", report: "r.xml" },
    stages: [
        {
            id: "s1",
            order: 1,
            title: { vi: "Mot", en: "One" },
            summary: { vi: "a", en: "a" },
            e2e: ["a", "b"],
            steps: [],
        },
        { id: "s2", order: 2, title: { vi: "Hai", en: "Two" }, summary: { vi: "b", en: "b" }, e2e: ["c"], steps: [] },
    ],
    packPaths: [],
}

const run = (
    stage: string,
    e2e: string,
    passed: boolean,
    at = "2026-11-17T01:00:00.000Z",
    why: string | null = null,
): HarnessRunRow => ({
    taskId: "harness:build:agent-cli",
    checkId: stage,
    ref: e2e,
    passed,
    commit: "abc1234",
    why,
    detail: null,
    at,
})

const proof = (stage: string, e2e: string, passed = true): HarnessProofRow => ({
    buildId: "agent-cli",
    stageId: stage,
    e2eId: e2e,
    passed,
    runId: "gh-1",
    commit: "abc1234",
    at: "2026-11-17T02:00:00.000Z",
})

describe("buildViewOf", () => {
    it("is none for a learner with no result", async () => {
        const { buildViewOf: view } = await build()

        const result = view(BUILD, "vi", [], [], null, "starci-next")

        expect(result.state).toBe("none")
        expect(result.title).toBe("Agent dong lenh")
        expect(result.stages.map((stage) => stage.state)).toEqual(["none", "none"])
        expect(result.repository).toEqual({ bound: false, repository: null, bindingId: null, audience: "starci-next" })
    })

    it("is practising for a passed relayed run and keeps the newest failure line of a stage", async () => {
        const { buildViewOf: view } = await build()

        const result = view(
            BUILD,
            "en",
            [run("s1", "a", true), run("s1", "b", false, "2026-11-17T03:00:00.000Z", "failed")],
            [],
            BOUND,
            "starci-next",
        )

        expect(result.stages[0]).toMatchObject({
            state: "practising",
            lastWhy: "failed",
            lastRunAt: "2026-11-17T03:00:00.000Z",
        })
        expect(result.stages[0]?.e2e.map((each) => [each.id, each.state])).toEqual([
            ["a", "practising"],
            ["b", "none"],
        ])
        expect(result).toMatchObject({ state: "practising", practisingStages: 1, provedStages: 0, title: "Agent CLI" })
        expect(result.repository).toEqual({
            bound: true,
            repository: "learner/agent",
            bindingId: "b1",
            audience: "starci-next",
        })
    })

    it("is proved only when every e2e of every stage has an attested passed result, and a later red relay does not lower it", async () => {
        const { buildViewOf: view } = await build()
        const proofs = [proof("s1", "a"), proof("s1", "b"), proof("s2", "c")]

        const result = view(
            BUILD,
            "vi",
            [run("s1", "a", false, "2026-11-17T09:00:00.000Z")],
            proofs,
            BOUND,
            "starci-next",
        )

        expect(result.state).toBe("proved")
        expect(result.stages.map((stage) => stage.state)).toEqual(["proved", "proved"])
        expect(result.provedStages).toBe(2)
    })

    it("is practising while one stage is still unproved", async () => {
        const { buildViewOf: view } = await build()

        const result = view(BUILD, "vi", [], [proof("s1", "a"), proof("s1", "b")], BOUND, "starci-next")

        expect(result.stages.map((stage) => stage.state)).toEqual(["proved", "none"])
        expect(result.state).toBe("practising")
    })

    it("does not count a failed attested result or another build as proof", async () => {
        const { buildViewOf: view } = await build()

        const result = view(
            BUILD,
            "vi",
            [],
            [proof("s1", "a", false), { ...proof("s1", "b"), buildId: "other" }],
            null,
            "starci-next",
        )

        expect(result.state).toBe("none")
    })

    it("never carries a pack path in its view", async () => {
        const { buildViewOf: view } = await build()

        const text = JSON.stringify(view({ ...BUILD, packPaths: ["source/a.ts"] }, "vi", [], [], null, "starci-next"))

        expect(text).not.toContain("source/a.ts")
    })
})

describe("rolledState", () => {
    it("rolls states up", async () => {
        const { rolledState: roll } = await build()

        expect(roll([])).toBe("none")
        expect(roll(["proved", "proved"])).toBe("proved")
        expect(roll(["proved", "none"])).toBe("practising")
        expect(roll(["none", "none"])).toBe("none")
    })
})

const TRAP = { id: "trap", shortcuts: [{ id: "env-read", title: { vi: "Doc env", en: "Reads the env file" } }] }

describe("probes, trials and the hub", () => {
    const probe = {
        id: "p",
        tool: "claude" as const,
        order: 1,
        title: { vi: "Nhan", en: "Label" },
        guide: "g",
        fix: { vi: "Tao file", en: "Create file" },
        yaml: "",
    }
    const doctorRow = (passed: boolean, detail: Record<string, unknown> | null): HarnessRunRow => ({
        taskId: "harness:doctor",
        checkId: "p",
        ref: "claude",
        passed,
        commit: null,
        why: null,
        detail,
        at: "2026-11-17T01:00:00.000Z",
    })

    it("reports a probe never uploaded as not run and a failed one with the hint of its reason", async () => {
        const { probeResultOf: result } = await build()

        expect(result(probe, "g", "en", []).status).toBe("not-run")
        expect(result(probe, "g", "en", [doctorRow(false, { status: "failed", reason: "missing" })])).toMatchObject({
            status: "failed",
            reason: "missing",
            fix: "Create file",
            guide: "g",
        })
        expect(result(probe, null, "vi", [doctorRow(true, null)])).toMatchObject({ status: "passed", reason: null })
    })

    it("reads the newest trial result of a trap with its shortcuts", async () => {
        const { trialResultOf: trial } = await build()
        const row: HarnessRunRow = {
            taskId: "harness:trial",
            checkId: "trap",
            ref: "codex",
            passed: false,
            commit: null,
            why: null,
            detail: { verdict: "breached", testsGreen: true, shortcuts: [{ kind: "env-read", blocked: false }, "bad"] },
            at: "2026-11-17T01:00:00.000Z",
        }

        expect(trial(TRAP, null, [row], "en")).toEqual({
            tool: "codex",
            verdict: "breached",
            testsGreen: true,
            shortcuts: [{ kind: "env-read", title: "Reads the env file", blocked: false }],
            at: "2026-11-17T01:00:00.000Z",
        })
        expect(trial(TRAP, "claude", [row], "en")).toBeNull()
        expect(trial({ ...TRAP, id: "other" }, null, [row], "en")).toBeNull()
    })

    it("counts the three parts of the hub and names the next build and guide", async () => {
        const { hubOf: hub, buildViewOf: view } = await build()
        const builds = [view(BUILD, "vi", [run("s1", "a", true)], [], null, "starci-next")]

        const parts = hub({
            builds,
            guides: [
                {
                    tool: "claude",
                    slug: "claude-md",
                    order: 1,
                    title: { vi: "a", en: "a" },
                    summary: { vi: "", en: "" },
                    minutes: null,
                    probes: ["p"],
                    sections: [],
                    contentHash: "h",
                },
            ],
            probes: [probe],
            doctorRows: [],
            docs: [
                {
                    slug: "overview",
                    order: 1,
                    title: { vi: "a", en: "a" },
                    summary: { vi: "", en: "" },
                    minutes: null,
                    sections: [],
                    contentHash: "h",
                },
            ],
            words: (key) => key,
        })

        expect(parts.map((part) => part.key)).toEqual(["build", "use", "docs"])
        expect(parts[0]).toMatchObject({
            total: 1,
            practising: 1,
            proved: 0,
            done: 0,
            nextId: "agent-cli",
            title: "part.build.title",
        })
        expect(parts[1]).toMatchObject({ total: 1, done: 0, nextId: "claude/claude-md" })
        expect(parts[2]).toMatchObject({ total: 1, nextId: "overview" })
    })

    it("marks a use part probe done once its doctor result passed", async () => {
        const { hubOf: hub } = await build()

        const parts = hub({
            builds: [],
            guides: [],
            probes: [probe],
            doctorRows: [doctorRow(true, null)],
            docs: [],
            words: (key) => key,
        })

        expect(parts[1]).toMatchObject({ done: 1, practising: 1, nextId: null })
        expect(parts[0]?.nextId).toBeNull()
    })
})
