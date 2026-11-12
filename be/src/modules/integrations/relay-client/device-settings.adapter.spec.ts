import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { homedir, tmpdir } from "node:os"
import { join } from "node:path"
import { Test } from "@nestjs/testing"
import { clearConfig, configPathOf, readConfig, writeConfig } from "./device-settings.adapter"

const ADAPTER: unique symbol = Symbol("relay-client.device-settings-adapter")
const adapter = { clearConfig, configPathOf, readConfig, writeConfig }

const build = async (): Promise<typeof adapter> => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: ADAPTER, useFactory: () => adapter }],
    }).compile()
    return moduleRef.get<typeof adapter>(ADAPTER)
}

describe("device settings", () => {
    let home: string

    beforeEach(() => {
        home = mkdtempSync(join(tmpdir(), "starci-settings-"))
    })

    afterEach(() => {
        rmSync(home, { recursive: true, force: true })
    })

    it("keeps the config in the home folder of the user when none is named", async () => {
        const settings = await build()

        expect(settings.configPathOf({})).toBe(join(homedir(), ".starci-next", "config.json"))
    })

    it("reads the stored address and token, and lets the environment address win", async () => {
        const settings = await build()
        writeFileSync(join(home, "config.json"), JSON.stringify({ baseUrl: "https://stored.test", deviceToken: "tok" }))

        expect(settings.readConfig({ STARCI_NEXT_HOME: home })).toEqual({
            baseUrl: "https://stored.test",
            deviceToken: "tok",
        })
        expect(settings.readConfig({ STARCI_NEXT_HOME: home, STARCI_NEXT_URL: "https://env.test" })).toMatchObject({
            baseUrl: "https://env.test",
        })
    })

    it("writes the config and forgets it", async () => {
        const settings = await build()
        const env = { STARCI_NEXT_HOME: home }

        settings.writeConfig(env, { baseUrl: "https://a.test", deviceToken: "t" })
        expect(settings.readConfig(env)).toEqual({ baseUrl: "https://a.test", deviceToken: "t" })

        settings.clearConfig(env)
        expect(settings.readConfig(env)).not.toHaveProperty("deviceToken")
    })
})
