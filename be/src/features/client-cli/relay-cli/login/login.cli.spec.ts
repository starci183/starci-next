import { mock } from "@starci/jest-preset"
import { Test } from "@nestjs/testing"
import { type RelayClientPort } from "@modules/integrations/relay-client"
import { LoginCli } from "./login.cli"

describe("LoginCli", () => {
    it("delegates login to the relay client once", async () => {
        const relay = mock<RelayClientPort>()
        relay.login.mockResolvedValue(undefined)
        const moduleRef = await Test.createTestingModule({
            providers: [LoginCli],
        })
            .useMocker(() => relay)
            .compile()

        await expect(moduleRef.get(LoginCli).run()).resolves.toBeUndefined()

        expect(relay.login).toHaveBeenCalledTimes(1)
    })
})
