import { Test } from "@nestjs/testing"
import { mockEntityManager } from "@starci/jest-preset"
import {
    CAREER_ITEM,
    CAREER_LEARNER,
    CAREER_NOW,
    ESSENTIALS_DRAFT,
    itemRowOf,
} from "@tests/fixtures/builders/career.builder"
import { ExperienceAuditService } from "./experience-audit.service"
import { INSERT_DECISION } from "./persistence/career.sql"

describe("ExperienceAuditService append", () => {
    it("appends one row with the line, the evidence references and the assignee of the moment", async () => {
        const manager = mockEntityManager({ query: [INSERT_DECISION, [{ decision_id: "d-1" }]] })
        const item = itemRowOf({ state: "pending-review", line: ESSENTIALS_DRAFT })
        const at = new Date(CAREER_NOW)

        const moduleRef = await Test.createTestingModule({ providers: [ExperienceAuditService] }).compile()

        const appended = moduleRef.get(ExperienceAuditService).append({
            manager,
            item,
            action: "submit",
            actorId: CAREER_LEARNER,
            actorRole: "learner",
            fromState: "ai-graded",
            note: null,
            at,
        })

        await expect(appended).resolves.toBeUndefined()
        expect(manager.query).toHaveBeenCalledWith(INSERT_DECISION, [
            CAREER_ITEM,
            "submit",
            CAREER_LEARNER,
            "learner",
            "ai-graded",
            "pending-review",
            null,
            JSON.stringify({
                line: ESSENTIALS_DRAFT,
                evidence: [{ kind: "lesson-proved", ref: "request-lifecycle" }],
                assigneeId: null,
            }),
            at,
        ])
    })
})
