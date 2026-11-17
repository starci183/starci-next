import { Test } from "@nestjs/testing"
import { EnvSource } from "@modules/platform/config"
import { parseProjectConfig } from "./project.config"

const PARSE: unique symbol = Symbol("spec.project-config")

const build = async (): Promise<typeof parseProjectConfig> => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: PARSE, useFactory: () => parseProjectConfig }],
    }).compile()
    return moduleRef.get(PARSE)
}

describe("parseProjectConfig", () => {
    it("leaves the OIDC audience unset by default, so the one fixed audience starci-next applies", async () => {
        const parse = await build()

        expect(parse(new EnvSource({}))).not.toHaveProperty("ciOidcAudience")
    })

    it("reads the OIDC audience a deployment overrides with PROJECT_CI_OIDC_AUDIENCE", async () => {
        const parse = await build()

        expect(parse(new EnvSource({ PROJECT_CI_OIDC_AUDIENCE: "https://api.example.test" })).ciOidcAudience).toBe(
            "https://api.example.test",
        )
        expect(parse(new EnvSource({ PROJECT_CI_OIDC_AUDIENCE: "" }))).not.toHaveProperty("ciOidcAudience")
    })
})
