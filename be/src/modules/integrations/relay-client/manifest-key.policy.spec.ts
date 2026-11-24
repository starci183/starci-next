import { manifestKeyOf } from "./manifest-key.policy"

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
})
