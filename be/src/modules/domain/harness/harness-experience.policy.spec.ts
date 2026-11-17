import { Test } from "@nestjs/testing"
import type { HarnessProofRow } from "./harness.contracts"
import { buildExperienceOf, isBuildProved } from "./harness-experience.policy"
import type { StoredBuild } from "./harness-progress.policy"

const POLICY = Symbol("harness-experience-policy")

const policies = { buildExperienceOf, isBuildProved }

const build = async (): Promise<typeof policies> => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: POLICY, useFactory: () => policies }],
    }).compile()
    return moduleRef.get<typeof policies>(POLICY)
}

const BUILD: StoredBuild = {
    id: "agent-cli",
    order: 1,
    title: { vi: "Agent dong lenh", en: "Agent CLI" },
    summary: { vi: "", en: "" },
    keys: [],
    runtime: { dir: "source", install: "npm ci", e2e: "npm run e2e", report: "r.xml" },
    stages: [
        { id: "s1", order: 1, title: { vi: "Mot", en: "One" }, summary: { vi: "", en: "" }, e2e: ["a"], steps: [] },
        { id: "s2", order: 2, title: { vi: "Hai", en: "Two" }, summary: { vi: "", en: "" }, e2e: ["b"], steps: [] },
    ],
    packPaths: [],
}

const proof = (stage: string, e2e: string, passed: boolean, runId: string, at: string): HarnessProofRow => ({
    buildId: "agent-cli",
    stageId: stage,
    e2eId: e2e,
    passed,
    runId,
    commit: "0123456789abcdef",
    at,
})

describe("buildExperienceOf", () => {
    it("makes nothing for a build with an e2e that has no attested passed result", async () => {
        const { buildExperienceOf: produce, isBuildProved: proved } = await build()
        const rows = [
            proof("s1", "a", true, "r1", "2026-11-17T01:00:00.000Z"),
            proof("s2", "b", false, "r1", "2026-11-17T01:00:00.000Z"),
        ]

        expect(proved(BUILD, rows)).toBe(false)
        expect(produce("learner", BUILD, rows)).toBeNull()
        expect(produce("learner", BUILD, [])).toBeNull()
    })

    it("grades a proved build as a pass with one signed-ci evidence per run and slots read from the proof only", async () => {
        const { buildExperienceOf: produce } = await build()
        const rows = [
            proof("s1", "a", true, "run-1", "2026-11-17T01:00:00.000Z"),
            proof("s2", "b", true, "run-2", "2026-11-17T02:00:00.000Z"),
        ]

        const params = produce("learner", BUILD, rows)

        expect(params).toMatchObject({
            learnerId: "learner",
            itemType: "harness.build-proved",
            subject: "agent-cli",
            projectId: null,
            grade: { result: "pass" },
        })
        expect(params?.evidence.map((item) => [item.ref, item.proofForm])).toEqual([
            ["run-1", "signed-ci"],
            ["run-2", "signed-ci"],
        ])
        expect(params?.slotValues.vi).toEqual({ build: "Agent dong lenh", stages: "2", ci: "#run-2 (0123456)" })
        expect(params?.slotValues.en["build"]).toBe("Agent CLI")
        expect(params?.grade.criteria.map((criterion) => criterion.level)).toEqual([2, 2])
    })
})
