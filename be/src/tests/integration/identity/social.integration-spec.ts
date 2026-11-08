import {
    SESSION_COOKIE,
    keysOf,
    type RefusalBody,
    type SocialExchangeBody,
    type SocialStartBody,
} from "../../fixtures/builders/identity.builder"
import { identityDoors } from "../../world/identity-doors.client"
import { identityModules } from "../../world/identity-world.options"
import { useTestWorld } from "../../world/use-test-world"

/** The cookies of a Set-Cookie header, which the test client joins into one line. */
const cookiesOf = (setCookie: string | undefined): Array<string> => (setCookie ?? "").split(/, (?=__Host-)/u)

/** The `name=value` pair of the pre-authentication cookie a social start set, for the browser that started it. */
const bindingOf = (setCookie: string | undefined): string =>
    cookiesOf(setCookie)
        .find((cookie) => cookie.startsWith("__Host-identity_social="))
        ?.split(";")[0] ?? ""

/**
 * identity social doors (integration): start answers the provider URL with the hint and an S256 challenge, the callback
 * exchange consumes its state once and lands on the validated path, and unknown providers, states and paths are refused.
 */
describe("identity social doors (integration)", () => {
    const world = useTestWorld({ modules: identityModules, apps: ["core"] })
    const doors = () => identityDoors(world)
    const callbackOf = async (provider: string, returnTo?: string) => {
        const started = await doors().post<SocialStartBody>("/api/identity/social/start", { provider, returnTo })
        const url = started.body.authorizationUrl
        const redirect = new URL(await doors().idp.authorize(url, { sub: `social-${provider}`, roles: ["member"] }))
        const code = redirect.searchParams.get("code") ?? ""
        const browser = { cookie: bindingOf(started.headers["set-cookie"]) }
        return { started, url, browser, exchange: { code, state: redirect.searchParams.get("state") ?? "" } }
    }

    beforeEach(() => doors().reset())

    it("starts with the provider hint, then exchanges the callback once", async () => {
        const { started, url, browser, exchange } = await callbackOf("github", "/lessons/1")

        const exchanged = await doors().post<SocialExchangeBody>("/api/identity/social/exchange", exchange, browser)
        const replay = await doors().post<RefusalBody>("/api/identity/social/exchange", exchange, browser)

        expect([started.status, keysOf(started.body)]).toEqual([200, ["authorizationUrl"]])
        expect(browser.cookie).toBe(`__Host-identity_social=${exchange.state}`)
        expect(started.headers["set-cookie"]).toMatch(/Path=\/; Secure; HttpOnly; SameSite=Lax; Max-Age=\d+/)
        expect(new URL(url).searchParams.get("code_challenge_method")).toBe("S256")
        await expect(doors().idp.idpHints()).resolves.toContain("github")
        expect([exchanged.status, exchanged.body]).toEqual([200, { returnTo: "/lessons/1" }])
        expect(cookiesOf(exchanged.headers["set-cookie"])).toContainEqual(expect.stringMatching(SESSION_COOKIE))
        expect(cookiesOf(exchanged.headers["set-cookie"])).toContainEqual(
            expect.stringMatching(/^__Host-identity_social=; Path=\/; Secure; HttpOnly; SameSite=Lax; Max-Age=0;/u),
        )
        expect([replay.status, replay.body.code]).toEqual([400, "IDENTITY_SOCIAL_STATE_INVALID"])
    })

    it("refuses a callback state another browser started (login CSRF), and keeps it for the browser that started it", async () => {
        const attacker = await callbackOf("github")
        const victim = await callbackOf("github")

        const withoutBinding = await doors().post<RefusalBody>("/api/identity/social/exchange", attacker.exchange)
        const foreign = await doors().post<RefusalBody>(
            "/api/identity/social/exchange",
            attacker.exchange,
            victim.browser,
        )
        const own = await doors().post<SocialExchangeBody>(
            "/api/identity/social/exchange",
            attacker.exchange,
            attacker.browser,
        )

        expect([withoutBinding.status, withoutBinding.body.code]).toEqual([400, "IDENTITY_SOCIAL_STATE_INVALID"])
        expect([foreign.status, foreign.body.code]).toEqual([400, "IDENTITY_SOCIAL_STATE_INVALID"])
        expect(cookiesOf(foreign.headers["set-cookie"])).not.toContainEqual(expect.stringMatching(SESSION_COOKIE))
        expect(own.status).toBe(200)
    })

    it("lands on the home path without a returnTo and refuses unknown providers, states and paths", async () => {
        const { browser, exchange } = await callbackOf("facebook")
        const exchanged = await doors().post<SocialExchangeBody>("/api/identity/social/exchange", exchange, browser)

        const unknown = await doors().post<RefusalBody>("/api/identity/social/start", { provider: "twitter" })
        const forged = await doors().post<RefusalBody>("/api/identity/social/exchange", {
            code: "c",
            state: "s".repeat(43),
        })
        const external = await doors().post<RefusalBody>("/api/identity/social/start", {
            provider: "github",
            returnTo: "//evil.test",
        })

        expect(exchanged.body).toEqual({ returnTo: "/" })
        expect([unknown.status, unknown.body.code]).toEqual([400, "IDENTITY_PROVIDER_UNKNOWN"])
        expect([forged.status, forged.body.code]).toEqual([400, "IDENTITY_SOCIAL_STATE_INVALID"])
        expect([external.status, external.body.code]).toEqual([400, "HTTP_SECURITY_REQUEST_INVALID"])
    })
})
