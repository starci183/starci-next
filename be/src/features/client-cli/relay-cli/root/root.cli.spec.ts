import { mock } from "@starci/jest-preset"
import { Test } from "@nestjs/testing"
import { type RelayClientPort } from "@modules/integrations/relay-client"
import { RootCli } from "./root.cli"

describe("RootCli", () => {
    it("delegates the version flag to the relay client once", async () => {
        const relay = mock<RelayClientPort>()
        relay.root.mockResolvedValue(undefined)
        const moduleRef = await Test.createTestingModule({ providers: [RootCli] })
            .useMocker(() => relay)
            .compile()
        const cli = moduleRef.get(RootCli)

        await expect(cli.run([], { version: cli.parseVersion() })).resolves.toBeUndefined()

        expect(relay.root).toHaveBeenCalledTimes(1)
        expect(relay.root).toHaveBeenCalledWith(true)
    })
})
