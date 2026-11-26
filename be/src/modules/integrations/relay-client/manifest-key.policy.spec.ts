import { DEV_MANIFEST_KEY, manifestKeyOf } from "./manifest-key.policy"

describe("manifest key", () => {
    it("lets the environment key win on any origin, the production one included", () => {
        const env = { STARCI_NEXT_MANIFEST_KEY: "env-pem" }

        expect(manifestKeyOf(env, "https://next.starci.org")).toBe("env-pem")
        expect(manifestKeyOf(env, "https://app.test")).toBe("env-pem")
    })

    it("has no key for an origin the package does not know, a staging host or a malformed one", () => {
        expect(manifestKeyOf({}, "https://next.staging.starci.org")).toBe("")
        expect(manifestKeyOf({}, "not a url")).toBe("")
        expect(manifestKeyOf({ STARCI_NEXT_MANIFEST_KEY: "" }, "https://app.test")).toBe("")
    })

    it("answers the same key for the app and the api host of one environment", () => {
        expect(manifestKeyOf({}, "https://next.starci.org/")).toBe(manifestKeyOf({}, "https://api.next.starci.org"))
        expect(manifestKeyOf({}, "http://localhost:3280")).toBe(manifestKeyOf({}, "https://starci-next-api-dev.starci.org"))
    })

    it("ships the dev stack's public key, so a learner on dev needs no STARCI_NEXT_MANIFEST_KEY", () => {
        expect(DEV_MANIFEST_KEY).toMatch(/^-----BEGIN PUBLIC KEY-----
[A-Za-z0-9+/=
]+-----END PUBLIC KEY-----
$/)
        expect(DEV_MANIFEST_KEY).not.toContain("PRIVATE")
        expect(manifestKeyOf({}, "https://starci-next-app-dev.starci.org")).toBe(DEV_MANIFEST_KEY)
        expect(manifestKeyOf({}, "http://localhost:3280")).toBe(DEV_MANIFEST_KEY)
    })
})
