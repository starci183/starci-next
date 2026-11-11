import { mock } from "@starci/jest-preset"
import { Test } from "@nestjs/testing"
import { type RelayClientPort } from "@modules/integrations/relay-client"
import { LogoutCli } from "./logout.cli"

describe("LogoutCli", () => {
    it("delegates logout to the relay client once", async () => {
        const relay = mock<RelayClientPort>()
        relay.logout.mockResolvedValue(undefined)
        const moduleRef = await Test.createTestingModule({
            providers: [LogoutCli],
        })
            .useMocker(() => relay)
            .compile()

        await expect(moduleRef.get(LogoutCli).run()).resolves.toBeUndefined()

        expect(relay.logout).toHaveBeenCalledTimes(1)
    })
})
