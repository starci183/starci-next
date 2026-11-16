import { Test } from "@nestjs/testing"
import { mockEntityManager } from "@starci/jest-preset"
import { PRIMARY_ENTITY_MANAGER } from "@modules/platform/database"
import type { RelayHarnessResultRow } from "./persistence/relay-events.rows"
import { SELECT_HARNESS_RESULTS } from "./persistence/relay-events.sql"
import { RelayHarnessService } from "./relay-harness.service"

const LEARNER = "20000000-0000-4000-8000-000000000002"
const AT = new Date("2026-11-17T03:00:00.000Z")

const build = async (rows: ReadonlyArray<RelayHarnessResultRow>) => {
    const em = mockEntityManager({ query: [[SELECT_HARNESS_RESULTS, [...rows]]] })
    const moduleRef = await Test.createTestingModule({
        providers: [RelayHarnessService, { provide: PRIMARY_ENTITY_MANAGER, useValue: em }],
    }).compile()
    return { service: moduleRef.get(RelayHarnessService), em }
}

const row = (patch: Partial<RelayHarnessResultRow>): RelayHarnessResultRow => ({
    task_id: "harness:build:agent-cli",
    check_id: "s1",
    ref: "a",
    passed: true,
    commit_sha: "abc1234",
    created_at: AT,
    detail: null,
    ...patch,
})

describe("RelayHarnessService", () => {
    it("reads the newest build results of the learner for the stage slot under the build task prefix", async () => {
        const { service, em } = await build([row({ detail: { why: "failed" }, passed: false })])

        const rows = await service.buildResults(LEARNER)

        expect(em.query).toHaveBeenCalledWith(SELECT_HARNESS_RESULTS, [
            LEARNER,
            "harness-stage",
            "harness:build:",
            expect.any(Number),
        ])
        expect(rows).toEqual([
            {
                taskId: "harness:build:agent-cli",
                checkId: "s1",
                ref: "a",
                passed: false,
                commit: "abc1234",
                why: "failed",
                detail: { why: "failed" },
                at: AT.toISOString(),
            },
        ])
    })

    it("reads the doctor results and the trial results from their own slots and tasks", async () => {
        const doctor = await build([row({ task_id: "harness:doctor", ref: "claude", detail: { reason: "missing" } })])
        const trial = await build([row({ task_id: "harness:trial", ref: "codex", passed: null })])

        const doctorRows = await doctor.service.doctorResults(LEARNER)
        const trialRows = await trial.service.trialResults(LEARNER)

        expect(doctor.em.query).toHaveBeenCalledWith(SELECT_HARNESS_RESULTS, [
            LEARNER,
            "harness-doctor",
            "harness:doctor",
            expect.any(Number),
        ])
        expect(trial.em.query).toHaveBeenCalledWith(SELECT_HARNESS_RESULTS, [
            LEARNER,
            "harness-trial",
            "harness:trial",
            expect.any(Number),
        ])
        expect(doctorRows[0]?.why).toBe("missing")
        expect(trialRows[0]?.passed).toBe(false)
    })
})
