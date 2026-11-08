import { Test } from "@nestjs/testing"
import { CAREER_LEARNER } from "@tests/fixtures/builders/career.builder"
import { SilentNotifierClient } from "./silent-notifier.client"

describe("SilentNotifierClient", () => {
    it("sends nothing and resolves", async () => {
        const moduleRef = await Test.createTestingModule({ providers: [SilentNotifierClient] }).compile()

        await expect(
            moduleRef.get(SilentNotifierClient).notify(CAREER_LEARNER, "experience.verified", {}, "/experience"),
        ).resolves.toBeUndefined()
    })
})
