import { Test } from "@nestjs/testing"
import { NoHubExperienceClient } from "./no-hub-experience.client"

describe("NoHubExperienceClient", () => {
    it("answers with no counts, as no experience read exists", async () => {
        const moduleRef = await Test.createTestingModule({ providers: [NoHubExperienceClient] }).compile()
        const client = moduleRef.get(NoHubExperienceClient)

        await expect(client.counts()).resolves.toEqual({})
    })
})
