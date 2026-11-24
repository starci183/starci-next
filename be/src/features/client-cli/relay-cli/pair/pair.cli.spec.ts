import { mock } from "@starci/jest-preset"
import { Test } from "@nestjs/testing"
import { type RelayClientPort } from "@modules/integrations/relay-client"
import { PairCli } from "./pair.cli"

describe("PairCli", () => {
    it("delegates the code to the relay client once", async () => {
        const relay = mock<RelayClientPort>()
        relay.pair.mockResolvedValue(undefined)
        const moduleRef = await Test.createTestingModule({ providers: [PairCli] })
            .useMocker(() => relay)
            .compile()

        await expect(moduleRef.get(PairCli).run(["ABCD-EFGH"])).resolves.toBeUndefined()

        expect(relay.pair).toHaveBeenCalledTimes(1)
        expect(relay.pair).toHaveBeenCalledWith("ABCD-EFGH")
    })
})
