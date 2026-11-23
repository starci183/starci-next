import { keysOf, learnersOf, type GrantBody, type RefusalBody } from "../../fixtures/builders/learner.builder"
import { identityDoors } from "../../world/identity-doors.client"
import { identityModules } from "../../world/identity-world.options"
import { useTestWorld } from "../../world/use-test-world"

/**
 * identity session (integration): the cookie session of the real core app. The session door answers a fresh access token for
 * the refresh cookie without rotating it, refresh rotates it, no or an unknown cookie is 401, and logout ends the device
 * session and answers 204 even without one.
 */
describe("identity session (integration)", () => {
    const world = useTestWorld({ modules: identityModules, apps: ["core"] })
    const doors = () => identityDoors(world)
    const nextLearner = learnersOf("a6")

    beforeEach(() => doors().reset())

    it("answers a fresh access token for a live cookie, with the name and email of the account and no refresh token", async () => {
        const learner = nextLearner()
        const signedIn = await doors().signInSession(learner)

        const read = await doors().get<GrantBody>("/auth/session", { cookie: signedIn.refresh })

        expect(read.status).toBe(200)
        expect(keysOf(read.body)).toEqual(["accessToken", "expiresAt", "expiresIn", "user"])
        expect(read.body.user).toMatchObject({ id: signedIn.subject, email: learner.email, name: learner.username })
        expect(Number.isNaN(Date.parse(read.body.expiresAt))).toBe(false)
        expect(JSON.stringify(read.body)).not.toMatch(/refresh|password/iu)
    })

    it("rotates the cookie on refresh and answers the same learner", async () => {
        const signedIn = await doors().signInSession(nextLearner())

        const refreshed = await doors().post<GrantBody>("/auth/refresh", undefined, { cookie: signedIn.refresh })

        expect(refreshed.status).toBe(200)
        expect(refreshed.headers["set-cookie"]).toMatch(/refresh_token=/u)
        expect(refreshed.body.user.id).toBe(signedIn.subject)
    })

    it.each([[{}], [{ cookie: `refresh_token=${"r".repeat(43)}` }]])(
        "answers 401 for the session of %j",
        async (headers) => {
            const read = await doors().get<RefusalBody>("/auth/session", headers)

            expect([read.status, read.body.code]).toEqual([401, "IDENTITY_REFRESH_INVALID"])
        },
    )

    it("expires a refresh cookie it rejects (unknown, or of an ended session), so the browser is left signed out and the sign-in form shows once", async () => {
        const signedIn = await doors().signInSession(nextLearner())
        await doors().post("/auth/logout", undefined, { cookie: signedIn.refresh })

        for (const cookie of [`refresh_token=${"r".repeat(43)}`, signedIn.refresh]) {
            const refused = await doors().post<RefusalBody>("/auth/refresh", undefined, { cookie })

            expect([refused.status, refused.body.code]).toEqual([401, "IDENTITY_REFRESH_INVALID"])
            expect(refused.headers["set-cookie"]).toMatch(/refresh_token=;[^,]*Expires=Thu, 01 Jan 1970/u)
        }
    })

    it("logs out: ends the device session and then answers 401", async () => {
        const signedIn = await doors().signInSession(nextLearner())
        const before = await doors().activeSessions()

        const out = await doors().post("/auth/logout", undefined, { cookie: signedIn.refresh })
        const after = await doors().get<RefusalBody>("/auth/session", { cookie: signedIn.refresh })

        expect(out.status).toBe(204)
        await expect(doors().activeSessions()).resolves.toBe(before - 1)
        expect([after.status, after.body.code]).toEqual([401, "IDENTITY_REFRESH_INVALID"])
    })

    it("answers 204 on logout even without a session", async () => {
        const out = await doors().post("/auth/logout")

        expect(out.status).toBe(204)
    })

    it("serves the public keys the access tokens verify against", async () => {
        const jwks = await doors().get<{ readonly keys: ReadonlyArray<object> }>("/auth/jwks")

        expect(jwks.status).toBe(200)
        expect(jwks.body.keys.length).toBeGreaterThan(0)
    })
})
