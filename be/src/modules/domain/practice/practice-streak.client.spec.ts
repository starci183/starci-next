import { Test } from "@nestjs/testing"
import { mock } from "@starci/jest-preset"
import { StreakService } from "@modules/domain/streak"
import { StreakServiceClient } from "./practice-streak.client"

describe("StreakServiceClient", () => {
    it("reports a graded attempt as a practice graded-attempt action under the attempt id", async () => {
        const streak = mock<StreakService>()
        const at = new Date("2026-11-08T10:00:00.000Z")
        const moduleRef = await Test.createTestingModule({
            providers: [StreakServiceClient, { provide: StreakService, useValue: streak }],
        }).compile()

        const reported = moduleRef.get(StreakServiceClient).recordStreakAction({
            learnerId: "learner-1",
            shard: "practice",
            action: "graded-attempt",
            actionId: "sub-1",
            sourceRef: "practice/two-sum",
            at,
        })

        await expect(reported).resolves.toBeUndefined()
        expect(streak.recordStreakAction).toHaveBeenCalledWith("learner-1", "practice", "graded-attempt", {
            actionId: "sub-1",
            sourceRef: "practice/two-sum",
            at,
        })
    })
})
