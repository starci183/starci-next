import { Test } from "@nestjs/testing"
import { EnvSource } from "@modules/platform/config"
import { parseRealtimeConfig } from "./realtime-config.mapper"

const PARSE: unique symbol = Symbol("spec.realtime-config")

const build = async (): Promise<typeof parseRealtimeConfig> => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: PARSE, useFactory: () => parseRealtimeConfig }],
    }).compile()
    return moduleRef.get(PARSE)
}

describe("parseRealtimeConfig", () => {
    it("reads the declared memory hub", async () => {
        const parse = await build()

        expect(parse(new EnvSource({ REALTIME_HUB: "memory" }))).toEqual({ hub: "memory" })
    })

    it.each([{}, { REALTIME_HUB: "redis" }, { REALTIME_HUB: "postgres" }])(
        "refuses %o: no silent memory default, no unbuilt hub",
        async (env) => {
            const parse = await build()

            expect(() => parse(new EnvSource(env))).toThrow("REALTIME_HUB_UNSUPPORTED")
        },
    )
})
