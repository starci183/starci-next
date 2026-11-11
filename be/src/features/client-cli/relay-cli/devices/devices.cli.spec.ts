import { mock } from "@starci/jest-preset"
import { Test } from "@nestjs/testing"
import { type RelayClientPort } from "@modules/integrations/relay-client"
import { DevicesCli } from "./devices.cli"

describe("DevicesCli", () => {
    it("delegates devices to the relay client once", async () => {
        const relay = mock<RelayClientPort>()
        relay.devices.mockResolvedValue(undefined)
        const moduleRef = await Test.createTestingModule({
            providers: [DevicesCli],
        })
            .useMocker(() => relay)
            .compile()

        await expect(moduleRef.get(DevicesCli).run()).resolves.toBeUndefined()

        expect(relay.devices).toHaveBeenCalledTimes(1)
    })
})
