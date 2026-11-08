import { mock } from "@starci/jest-preset"
import { Test } from "@nestjs/testing"
import { RelayErrorCode } from "./errors/relay.error"
import { RelayCredentialAdapter } from "./relay-credential.adapter"
import { RelayDeviceService } from "./relay-device.service"

const TOKEN = "t".repeat(43)

const build = async () => {
    const devices = mock<RelayDeviceService>()
    const moduleRef = await Test.createTestingModule({
        providers: [RelayCredentialAdapter, { provide: RelayDeviceService, useValue: devices }],
    }).compile()
    return { adapter: moduleRef.get(RelayCredentialAdapter), devices }
}

describe("RelayCredentialAdapter", () => {
    it("proves a bearer device token as the device of its learner", async () => {
        const { adapter, devices } = await build()
        devices.authenticate.mockResolvedValue({ learnerId: "l-1", deviceId: "d-1" })

        await expect(adapter.authenticate({ kind: "tool-token" }, `Bearer ${TOKEN}`)).resolves.toEqual({
            kind: "tool-token",
            subject: "d-1",
            workspaceId: "l-1",
        })
        expect(devices.authenticate).toHaveBeenCalledWith(TOKEN)
    })

    it.each<[string, "tool-token" | "api-key", string]>([
        ["another credential family", "api-key", `Bearer ${TOKEN}`],
        ["no bearer", "tool-token", TOKEN],
        ["an empty header", "tool-token", ""],
    ])("refuses %s as RELAY_DEVICE_REVOKED", async (_case, kind, header) => {
        const { adapter, devices } = await build()

        await expect(adapter.authenticate({ kind }, header)).rejects.toMatchObject({
            code: RelayErrorCode.DeviceRevoked,
        })
        expect(devices.authenticate).not.toHaveBeenCalled()
    })
})
