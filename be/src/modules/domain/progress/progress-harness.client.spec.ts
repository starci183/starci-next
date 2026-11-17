import { Test } from "@nestjs/testing"
import { mock } from "@starci/jest-preset"
import {
    HarnessReadService,
    type HarnessBuildSummaryView,
    type HarnessBuildView,
    type HarnessProbeResultView,
    type HarnessProbeStatus,
    type HarnessProofState,
    type HarnessStageView,
    type HarnessTrapView,
} from "@modules/domain/harness"
import { RelayHarnessService } from "@modules/domain/relay"
import { ProgressHarnessClient } from "./progress-harness.client"

const LEARNER = "20000000-0000-4000-8000-000000000011"

const stageOf = (id: string, title: string, state: HarnessProofState, lastRunAt: string | null): HarnessStageView => ({
    id,
    order: 1,
    title,
    summary: title,
    state,
    e2e: [],
    steps: [],
    lastRunAt,
    lastWhy: null,
})

const SUMMARY: HarnessBuildSummaryView = {
    id: "agent-cli",
    order: 1,
    title: "Agent",
    summary: "Agent",
    keys: [],
    stageCount: 3,
    practisingStages: 1,
    provedStages: 1,
    state: "practising",
}

const BUILD: HarnessBuildView = {
    ...SUMMARY,
    runtime: { dir: "source", install: "npm ci", e2e: "npm run e2e", report: "report.xml" },
    repository: { bound: false, repository: null, bindingId: null, audience: "starci-next" },
    stages: [
        stageOf("s1", "Loop", "proved", "2026-11-14T08:00:00.000Z"),
        stageOf("s2", "Tools", "practising", "2026-11-15T08:00:00.000Z"),
        stageOf("s3", "Memory", "none", null),
    ],
}

const probeOf = (id: string, status: HarnessProbeStatus): HarnessProbeResultView => ({
    id,
    order: 1,
    title: id,
    guide: null,
    fix: null,
    status,
    reason: null,
    at: null,
})

const trapOf = (id: string, verdict: string | null): HarnessTrapView => ({
    id,
    order: 1,
    title: id,
    brief: "brief",
    prompt: "prompt",
    tools: ["claude"],
    budget: { maxTurns: 10, maxUsd: 1, timeoutSec: 600 },
    shortcuts: [],
    last:
        verdict === null
            ? null
            : { tool: "claude", verdict, testsGreen: true, shortcuts: [], at: "2026-11-16T08:00:00.000Z" },
})

const build = async () => {
    const harness = mock<HarnessReadService>()
    const relay = mock<RelayHarnessService>()
    relay.buildResults.mockResolvedValue([])
    relay.doctorResults.mockResolvedValue([])
    relay.trialResults.mockResolvedValue([])
    harness.builds.mockResolvedValue([SUMMARY])
    harness.build.mockResolvedValue(BUILD)
    harness.doctor.mockImplementation((tool) =>
        Promise.resolve({ tool, passed: 1, total: 2, probes: [probeOf("a", "passed"), probeOf("b", "failed")] }),
    )
    harness.trials.mockResolvedValue([
        trapOf("held-trap", "held"),
        trapOf("odd-trap", "weird"),
        trapOf("never-trap", null),
    ])
    const moduleRef = await Test.createTestingModule({
        providers: [
            ProgressHarnessClient,
            { provide: HarnessReadService, useValue: harness },
            { provide: RelayHarnessService, useValue: relay },
        ],
    }).compile()
    return { client: moduleRef.get(ProgressHarnessClient), harness, relay }
}

describe("ProgressHarnessClient read", () => {
    it("reads the builds with the stage states and the events of stages that have a result", async () => {
        const { client } = await build()

        const source = await client.read(LEARNER, "en")

        expect(source.builds).toEqual([
            {
                id: "agent-cli",
                title: "Agent",
                stages: [
                    { id: "s1", title: "Loop", state: "proved" },
                    { id: "s2", title: "Tools", state: "practising" },
                    { id: "s3", title: "Memory", state: "none" },
                ],
            },
        ])
        expect(source.events.map((event) => event.id)).toEqual(["agent-cli:s1", "agent-cli:s2"])
    })

    it("reads the doctor of each tool with the probes that failed", async () => {
        const { client } = await build()

        const source = await client.read(LEARNER, "vi")

        expect(source.doctor).toEqual([
            { tool: "claude", passed: 1, total: 2, failed: 1 },
            { tool: "codex", passed: 1, total: 2, failed: 1 },
        ])
    })

    it("reads the newest trial of each trap and counts a verdict it does not know as never tried", async () => {
        const { client } = await build()

        const source = await client.read(LEARNER, "en")

        expect(source.trials.map((trial) => trial.last?.verdict ?? null)).toEqual(["held", null, null])
    })

    it("asks for the results of the learner in the asked locale", async () => {
        const { client, relay, harness } = await build()

        await client.read(LEARNER, "vi")

        expect(relay.buildResults).toHaveBeenCalledWith(LEARNER)
        expect(harness.builds).toHaveBeenCalledWith(LEARNER, "vi", [])
    })
})
