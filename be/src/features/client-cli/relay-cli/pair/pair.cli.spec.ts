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

        await expect(moduleRef.get(PairCli).run(["123456"])).resolves.toBeUndefined()

        expect(relay.pair).toHaveBeenCalledTimes(1)
        expect(relay.pair).toHaveBeenCalledWith("123456")
    })

    it("joins a code typed with spaces, which the shell splits into several arguments", async () => {
        const relay = mock<RelayClientPort>()
        relay.pair.mockResolvedValue(undefined)
        const moduleRef = await Test.createTestingModule({ providers: [PairCli] })
            .useMocker(() => relay)
            .compile()

        await moduleRef.get(PairCli).run(["123", "456"])

        expect(relay.pair).toHaveBeenCalledWith("123 456")
    })
})
