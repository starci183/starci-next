import { Test } from "@nestjs/testing"
import { NoopStreakClient } from "./noop-streak.client"

describe("NoopStreakClient", () => {
    it("accepts the announcement of a graded attempt and does nothing with it", async () => {
        const moduleRef = await Test.createTestingModule({ providers: [NoopStreakClient] }).compile()

        await expect(moduleRef.get(NoopStreakClient).recordStreakAction()).resolves.toBeUndefined()
    })
})
