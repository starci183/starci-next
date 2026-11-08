import {
    SESSION_COOKIE,
    keysOf,
    learnersOf,
    type ChallengeBody,
    type RefusalBody,
} from "../../fixtures/builders/identity.builder"
import { identityDoors } from "../../world/identity-doors.client"
import { identityModules } from "../../world/identity-world.options"
import { useTestWorld } from "../../world/use-test-world"

/**
 * identity sign-in doors (integration): the real core app, the Keycloak fake and the SMTP fake. It proves credentials
 * open an emailed-code challenge, the code completes the sign-in with only the host-only cookie, refusals are generic,
 * and a provider outage is a 503.
 */
describe("identity sign-in doors (integration)", () => {
    const world = useTestWorld({ modules: identityModules, apps: ["core"] })
    const doors = () => identityDoors(world)
    const nextLearner = learnersOf("a1")

    beforeEach(() => doors().reset())

    it("signs in with credentials, then the emailed code, setting only the host-only cookie", async () => {
        const learner = nextLearner()
        await doors().seed(learner)
        const before = await doors().activeSessions()

        const opened = await doors().post<ChallengeBody>("/api/identity/sign-in", {
            identifier: learner.username,
            password: learner.password,
        })
        const code = await doors().codeSentTo(learner.email)
        const verified = await doors().post("/api/identity/sign-in/verify", { challenge: opened.body.challenge, code })

        expect(opened.status).toBe(200)
        expect(keysOf(opened.body)).toEqual(["challenge", "email", "expiresAt"])
        expect(opened.body.email).not.toBe(learner.email)
        expect(Number.isNaN(Date.parse(opened.body.expiresAt))).toBe(false)
        expect(verified.status).toBe(204)
        expect(verified.headers["set-cookie"]).toMatch(SESSION_COOKIE)
        expect(verified.headers["cache-control"]).toBe("no-store")
        await expect(doors().activeSessions()).resolves.toBe(before + 1)
    })

    it("accepts the email as identifier and refuses a wrong password like an unknown account", async () => {
        const learner = nextLearner()
        await doors().seed(learner)

        const byEmail = await doors().post("/api/identity/sign-in", {
            identifier: learner.email,
            password: learner.password,
        })
        const wrong = await doors().post<RefusalBody>("/api/identity/sign-in", {
            identifier: learner.username,
            password: `${learner.password}x`,
        })
        const unknown = await doors().post<RefusalBody>("/api/identity/sign-in", {
            identifier: "nobody-here",
            password: learner.password,
        })

        expect(byEmail.status).toBe(200)
        expect([wrong.status, wrong.body.code]).toEqual([401, "IDENTITY_CREDENTIALS_REJECTED"])
        expect(unknown.body).toEqual(wrong.body)
        expect(wrong.headers["set-cookie"]).toBeUndefined()
    })

    it("answers 503 IDENTITY_PROVIDER_UNAVAILABLE while the provider fails", async () => {
        const learner = nextLearner()
        await doors().seed(learner)
        await world.fake.idp?.failNext({ status: 503 })

        const refused = await doors().post<RefusalBody>("/api/identity/sign-in", {
            identifier: learner.username,
            password: learner.password,
        })

        expect([refused.status, refused.body.code]).toEqual([503, "IDENTITY_PROVIDER_UNAVAILABLE"])
    })
})
