import { Test } from "@nestjs/testing"
import { EmptyPracticeClient } from "./empty-practice.client"

describe("EmptyPracticeClient", () => {
    it("answers every pattern with no problem, so no practice item can be claimed", async () => {
        const moduleRef = await Test.createTestingModule({ providers: [EmptyPracticeClient] }).compile()

        await expect(
            moduleRef.get(EmptyPracticeClient).completion({ learnerId: "l", patternId: "arrays", locale: "en" }),
        ).resolves.toMatchObject({ patternId: "arrays", problemCount: 0, acceptedCount: 0, viewedCount: 0 })
    })
})
