import { mock } from "@starci/jest-preset"
import { Test } from "@nestjs/testing"
import { type RelayClientPort } from "@modules/integrations/relay-client"
import { InstallServiceCli } from "./install-service.cli"

describe("InstallServiceCli", () => {
    it("delegates install-service to the relay client once", async () => {
        const relay = mock<RelayClientPort>()
        relay.installService.mockResolvedValue(undefined)
        const moduleRef = await Test.createTestingModule({ providers: [InstallServiceCli] })
            .useMocker(() => relay)
            .compile()
        const cli = moduleRef.get(InstallServiceCli)

        await expect(cli.run([], { yes: cli.parseYes() })).resolves.toBeUndefined()

        expect(relay.installService).toHaveBeenCalledTimes(1)
        expect(relay.installService).toHaveBeenCalledWith(true)
    })
})
