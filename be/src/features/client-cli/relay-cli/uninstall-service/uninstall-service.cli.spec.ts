import { mock } from "@starci/jest-preset"
import { Test } from "@nestjs/testing"
import { type RelayClientPort } from "@modules/integrations/relay-client"
import { UninstallServiceCli } from "./uninstall-service.cli"

describe("UninstallServiceCli", () => {
    it("delegates uninstall-service to the relay client once", async () => {
        const relay = mock<RelayClientPort>()
        relay.uninstallService.mockResolvedValue(undefined)
        const moduleRef = await Test.createTestingModule({ providers: [UninstallServiceCli] })
            .useMocker(() => relay)
            .compile()

        await expect(moduleRef.get(UninstallServiceCli).run()).resolves.toBeUndefined()

        expect(relay.uninstallService).toHaveBeenCalledTimes(1)
    })
})
