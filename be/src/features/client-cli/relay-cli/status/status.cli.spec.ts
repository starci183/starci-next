import { mock } from "@starci/jest-preset"
import { Test } from "@nestjs/testing"
import { type RelayClientPort } from "@modules/integrations/relay-client"
import { StatusCli } from "./status.cli"

describe("StatusCli", () => {
    it("delegates status to the relay client once", async () => {
        const relay = mock<RelayClientPort>()
        relay.status.mockResolvedValue(undefined)
        const moduleRef = await Test.createTestingModule({
            providers: [StatusCli],
        })
            .useMocker(() => relay)
            .compile()

        await expect(moduleRef.get(StatusCli).run()).resolves.toBeUndefined()

        expect(relay.status).toHaveBeenCalledTimes(1)
    })
})
