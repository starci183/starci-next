import { mockEntityManager } from "@starci/jest-preset"
import { Test } from "@nestjs/testing"
import { PRIMARY_ENTITY_MANAGER } from "@modules/platform/database"
import { RelayProjectService } from "./relay-project.service"
import { SELECT_TASK_RESULTS } from "./persistence/relay-events.sql"

const AT = new Date("2026-11-09T02:00:00.000Z")

describe("RelayProjectService", () => {
    it("answers the project's uploaded check results as practice results, each under its client event id", async () => {
        const em = mockEntityManager({
            query: [
                SELECT_TASK_RESULTS,
                [
                    {
                        event_id: "e-1",
                        run_id: "r-1",
                        concept_id: "guard",
                        slot: "test",
                        ref: "guard rejects",
                        passed: true,
                        commit_sha: "abc1234",
                        created_at: AT,
                    },
                    {
                        event_id: "e-2",
                        run_id: "r-1",
                        concept_id: "pipe",
                        slot: "e2e",
                        ref: null,
                        passed: null,
                        commit_sha: null,
                        created_at: AT,
                    },
                ],
            ],
        })
        const moduleRef = await Test.createTestingModule({
            providers: [RelayProjectService, { provide: PRIMARY_ENTITY_MANAGER, useValue: em }],
        }).compile()

        const results = await moduleRef
            .get(RelayProjectService)
            .checkResults({ learnerId: "l-1", projectId: "p-1", after: null })

        expect(results).toEqual([
            {
                eventId: "e-1",
                runId: "r-1",
                conceptId: "guard",
                slot: "test",
                ref: "guard rejects",
                passed: true,
                commit: "abc1234",
                at: AT,
            },
            {
                eventId: "e-2",
                runId: "r-1",
                conceptId: "pipe",
                slot: "e2e",
                ref: "",
                passed: false,
                commit: null,
                at: AT,
            },
        ])
        expect(em.query).toHaveBeenCalledWith(SELECT_TASK_RESULTS, ["l-1", "p-1", null, 500])
    })
})
