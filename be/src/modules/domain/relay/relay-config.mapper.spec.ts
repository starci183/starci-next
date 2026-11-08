import { Test } from "@nestjs/testing"
import { EnvSource } from "@modules/platform/config"
import { parseRelayConfig } from "./relay-config.mapper"

const PARSE: unique symbol = Symbol("spec.relay-config")

const build = async (): Promise<typeof parseRelayConfig> => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: PARSE, useFactory: () => parseRelayConfig }],
    }).compile()
    return moduleRef.get(PARSE)
}

describe("parseRelayConfig", () => {
    it("reads the Q-R-2 defaults and the confirm page of the web origin, with no key in development", async () => {
        const parse = await build()

        expect(parse(new EnvSource({}), "https://app.test")).toEqual({
            verifyUrl: "https://app.test/devices",
            pairingTtlSeconds: 600,
            premiumDeviceLimit: 2,
            freeDeviceLimit: 1,
            manifestSigningKey: null,
            serviceKey: null,
        })
    })

    it("reads the sealed signing key and the tunables", async () => {
        const parse = await build()

        const options = parse(
            new EnvSource({
                NODE_ENV: "production",
                RELAY_MANIFEST_SIGNING_KEY: "pem",
                RELAY_SERVICE_KEY: "service",
                RELAY_FREE_DEVICE_LIMIT: "2",
            }),
            "https://app.test",
        )

        expect(options.manifestSigningKey?.reveal()).toBe("pem")
        expect(options.serviceKey?.reveal()).toBe("service")
        expect(options.freeDeviceLimit).toBe(2)
    })

    it("refuses to boot outside development and test without a sealed signing key", async () => {
        const parse = await build()

        expect(() => parse(new EnvSource({ NODE_ENV: "production" }), "https://app.test")).toThrow("RELAY_UNAVAILABLE")
        expect(() =>
            parse(new EnvSource({ NODE_ENV: "production", RELAY_MANIFEST_SIGNING_KEY: "pem" }), "https://app.test"),
        ).toThrow("RELAY_UNAVAILABLE")
    })
})
