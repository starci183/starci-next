import { EnvSource } from "@modules/platform/config"
import { parseContentConfig } from "@modules/domain/content"

describe("content environment contract", () => {
    it("composes without a git mount when the environment declares none", () => {
        const config = parseContentConfig(new EnvSource({}))

        expect(config.git).toBeNull()
        expect(config.environment.read()).toEqual({})
    })

    it("reads the content repository, its pinned ref, the data repository and the token", () => {
        const config = parseContentConfig(
            new EnvSource({
                CONTENT_DATASOURCES_DIR: "/srv/datasources",
                CONTENT_GIT_URL: "https://github.com/starci183/starci-next-data.git",
                CONTENT_GIT_REF: "abc1234",
                CONTENT_GIT_TOKEN: "token-value",
                CONTENT_DATA_GIT_URL: "https://github.com/starci-lab/data.git",
            }),
        )

        expect(config.git?.datasourcesDir).toBe("/srv/datasources")
        expect(config.git?.content.ref).toBe("abc1234")
        expect(config.git?.content.token?.reveal()).toBe("token-value")
        expect(config.git?.data?.ref).toBeNull()
        expect(config.git?.data?.token).toBeNull()
        expect(JSON.stringify(config)).not.toContain("token-value")
        expect(config.environment.read()).toMatchObject({ CONTENT_GIT_REF: "abc1234" })
    })

    it("stops boot with a missing-key error when the mount is half declared", () => {
        expect(() => parseContentConfig(new EnvSource({ CONTENT_GIT_URL: "https://example.com/x.git" }))).toThrow(
            "CONFIG_KEY_MISSING",
        )
    })
})
