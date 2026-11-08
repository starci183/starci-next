import { Test } from "@nestjs/testing"
import { UnattestedCiClient } from "./unattested-ci.client"

describe("UnattestedCiClient", () => {
    it("attests no run while no GitHub OIDC verifier is composed", async () => {
        const moduleRef = await Test.createTestingModule({ providers: [UnattestedCiClient] }).compile()

        await expect(moduleRef.get(UnattestedCiClient).attest()).resolves.toEqual({
            kind: "signed-only",
            reason: "unconfigured",
        })
    })
})
