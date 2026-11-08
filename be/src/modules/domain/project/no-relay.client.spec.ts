import { Test } from "@nestjs/testing"
import { NoRelayClient } from "./no-relay.client"

const build = async (): Promise<NoRelayClient> => {
    const moduleRef = await Test.createTestingModule({ providers: [NoRelayClient] }).compile()
    return moduleRef.get(NoRelayClient)
}

describe("NoRelayClient", () => {
    it("reads no check result while the relay is not built", async () => {
        const relay = await build()

        await expect(relay.checkResults()).resolves.toEqual([])
    })
})
