import { Test } from "@nestjs/testing"
import type { RelayUpload } from "./relay-feed.contracts"
import { resultDetailOf, uploadValid } from "./relay-feed.policy"
import { harnessFactsValid } from "./relay-harness.policy"

const POLICY = Symbol("relay-harness-policy")

const policies = { harnessFactsValid, resultDetailOf, uploadValid }

const build = async (): Promise<typeof policies> => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: POLICY, useFactory: () => policies }],
    }).compile()
    return moduleRef.get<typeof policies>(POLICY)
}

const BASE = {
    eventId: "6f1d6f6e-5d5c-4d8e-8a53-0a1a2b3c4d5e",
    kind: "check.result" as const,
    runId: "run-1",
    passed: true,
}

const stage: RelayUpload = {
    ...BASE,
    taskId: "harness:build:agent-cli",
    checkId: "s1-loop",
    slot: "harness-stage",
    ref: "loop-calls-tool",
    buildId: "agent-cli",
    stageId: "s1-loop",
    envPresent: ["ANTHROPIC_API_KEY"],
    why: "passed",
    commit: "abc1234",
}

const doctor: RelayUpload = {
    ...BASE,
    taskId: "harness:doctor",
    checkId: "claude-md-present",
    slot: "harness-doctor",
    ref: "claude",
    tool: "claude",
    status: "failed",
    reason: "missing",
}

const trial: RelayUpload = {
    ...BASE,
    taskId: "harness:trial",
    checkId: "red-tests-pressure",
    slot: "harness-trial",
    ref: "codex",
    tool: "codex",
    verdict: "breached",
    testsGreen: true,
    shortcuts: [{ kind: "env-read", blocked: false }],
}

describe("harness results of the relay", () => {
    it("accepts a stage result of one e2e with the key names that were present and stores them in detail", async () => {
        const { uploadValid: valid, resultDetailOf: detail } = await build()

        expect(valid(stage)).toBe(true)
        expect(detail(stage)).toEqual({
            why: "passed",
            buildId: "agent-cli",
            stageId: "s1-loop",
            envPresent: ["ANTHROPIC_API_KEY"],
        })
    })

    it.each([
        ["a lower case key name", { envPresent: ["anthropic_api_key"] }],
        ["a key name with a value", { envPresent: ["KEY=secret"] }],
        [
            "more than sixteen key names",
            { envPresent: Array.from({ length: 17 }, (_n, index) => `KEY_${String(index)}`) },
        ],
        ["a task that names another build", { taskId: "harness:build:other" }],
        ["a check that is not the stage", { checkId: "s2" }],
        ["no e2e ref", { ref: undefined }],
        ["no stage id", { stageId: undefined }],
    ])("refuses a stage result with %s", async (_name, patch) => {
        const { uploadValid: valid } = await build()

        expect(valid({ ...stage, ...patch })).toBe(false)
    })

    it("accepts a doctor result and a trial result, and stores their facts", async () => {
        const { uploadValid: valid, resultDetailOf: detail } = await build()

        expect(valid(doctor)).toBe(true)
        expect(valid(trial)).toBe(true)
        expect(detail(doctor)).toEqual({ tool: "claude", status: "failed", reason: "missing" })
        expect(detail(trial)).toEqual({
            tool: "codex",
            verdict: "breached",
            testsGreen: true,
            shortcuts: [{ kind: "env-read", blocked: false }],
        })
    })

    it.each([
        ["a doctor result for a tool that is not claude or codex", { ...doctor, tool: "cursor", ref: "cursor" }],
        ["a doctor result with an unknown status", { ...doctor, status: "maybe" }],
        ["a doctor result under the trial task", { ...doctor, taskId: "harness:trial" }],
        ["a trial result with an unknown verdict", { ...trial, verdict: "cheated" }],
        ["a trial result with no testsGreen", { ...trial, testsGreen: undefined }],
        ["a trial result with a ref that is not its tool", { ...trial, ref: "claude" }],
        [
            "a trial result with more than twenty shortcuts",
            { ...trial, shortcuts: Array.from({ length: 21 }, () => ({ kind: "env-read", blocked: true })) },
        ],
    ])("refuses %s", async (_name, upload) => {
        const { uploadValid: valid } = await build()

        expect(valid(upload)).toBe(false)
    })

    it("refuses harness facts on a result of any other slot", async () => {
        const { harnessFactsValid: facts } = await build()

        expect(facts({ ...BASE, taskId: "t", checkId: "c", slot: "test", verdict: "held" })).toBe(false)
        expect(facts({ ...BASE, taskId: "t", checkId: "c", slot: "scenario" })).toBe(true)
        expect(facts({ ...BASE, taskId: "t", checkId: "c" })).toBe(true)
    })
})
