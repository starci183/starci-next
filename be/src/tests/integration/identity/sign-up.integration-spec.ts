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
 * identity sign-up doors (integration): the account exists only after the emailed code, then the learner is signed in;
 * a registered email, a bad password or username and unaccepted terms are refused with their codes.
 */
describe("identity sign-up doors (integration)", () => {
    const world = useTestWorld({ modules: identityModules, apps: ["core"] })
    const doors = () => identityDoors(world)
    const nextLearner = learnersOf("a3")

    beforeEach(() => doors().reset())

    it("creates the account only after the code, then signs the learner in", async () => {
        const learner = nextLearner()
        const body = { email: learner.email, password: learner.password, username: learner.username, acceptTerms: true }
        const signIn = { identifier: learner.username, password: learner.password }

        const signUp = await doors().post<ChallengeBody>("/api/identity/sign-up", body)
        const early = await doors().post("/api/identity/sign-in", signIn)
        const verified = await doors().post("/api/identity/sign-up/verify", {
            challenge: signUp.body.challenge,
            code: await doors().codeSentTo(learner.email),
        })
        const later = await doors().post("/api/identity/sign-in", signIn)

        expect(signUp.status).toBe(200)
        expect(keysOf(signUp.body)).toEqual(["challenge", "email", "expiresAt"])
        expect(early.status).toBe(401)
        expect(verified.status).toBe(204)
        expect(verified.headers["set-cookie"]).toMatch(SESSION_COOKIE)
        expect(later.status).toBe(200)
    })

    it("refuses a registered email, a short password, a short username and unaccepted terms", async () => {
        const registered = nextLearner()
        await doors().seed(registered)
        const fresh = nextLearner()
        const body = { email: fresh.email, password: fresh.password, acceptTerms: true }
        const post = (extra: object) => doors().post<RefusalBody>("/api/identity/sign-up", { ...body, ...extra })

        const taken = await post({ email: registered.email })
        const short = await post({ password: "12345" })
        const username = await post({ username: "ab" })
        const terms = await post({ acceptTerms: false })

        expect([taken.status, taken.body.code]).toEqual([409, "IDENTITY_EMAIL_REGISTERED"])
        expect([short.status, short.body.code]).toEqual([400, "IDENTITY_PASSWORD_INVALID"])
        expect(username.status).toBe(400)
        expect([terms.status, terms.body.code]).toEqual([400, "HTTP_SECURITY_REQUEST_INVALID"])
    })
})
