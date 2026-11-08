import { Test } from "@nestjs/testing"
import { coachRequestOf } from "@tests/fixtures/builders/attempt.builder"
import { AttemptErrorCode } from "./errors/attempt.error"
import { UnconfiguredCoachClient } from "./unconfigured-coach.client"

describe("UnconfiguredCoachClient grade", () => {
    it("refuses with the stable code of an unconfigured coach", async () => {
        const moduleRef = await Test.createTestingModule({ providers: [UnconfiguredCoachClient] }).compile()
        const coach = moduleRef.get(UnconfiguredCoachClient)

        await expect(coach.grade(coachRequestOf())).rejects.toMatchObject({
            code: AttemptErrorCode.CoachUnconfigured,
        })
    })
})
