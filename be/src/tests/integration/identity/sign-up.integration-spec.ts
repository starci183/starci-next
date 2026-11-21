import { learnersOf, type RefusalBody } from "../../fixtures/builders/learner.builder"
import { identityDoors } from "../../world/identity-doors.client"
import { identityModules } from "../../world/identity-world.options"
import { useTestWorld } from "../../world/use-test-world"

/**
 * identity sign-up doors (integration): sign-up mails one confirmation link and answers 204 whether or not the address is
 * known; the account signs in only after the link is spent; a weak password and a spent link are refused with their codes.
 */
describe("identity sign-up doors (integration)", () => {
    const world = useTestWorld({ modules: identityModules, apps: ["core"] })
    const doors = () => identityDoors(world)
    const nextLearner = learnersOf("a3")

    beforeEach(() => doors().reset())

    it("creates the account, mails the link and lets the learner in only after the link is spent", async () => {
        const learner = nextLearner()
        const body = { email: learner.email, password: learner.password, name: learner.username }
        const signIn = { email: learner.email, password: learner.password }

        const signUp = await doors().post("/auth/signup", body)
        const token = await doors().linkTokenSentTo(learner.email)
        const early = await doors().post<RefusalBody>("/auth/login", signIn)
        const confirmed = await doors().post("/auth/confirm", { token })
        const later = await doors().post("/auth/login", signIn)
        const again = await doors().post<RefusalBody>("/auth/confirm", { token })

        expect(signUp.status).toBe(204)
        expect([early.status, early.body.code]).toEqual([403, "IDENTITY_EMAIL_NOT_CONFIRMED"])
        expect(confirmed.status).toBe(204)
        expect(later.status).toBe(200)
        expect([again.status, again.body.code]).toEqual([400, "IDENTITY_RESET_TOKEN_INVALID"])
    })

    it("answers a registered address like a new one and refuses a weak password", async () => {
        const registered = nextLearner()
        await doors().register(registered)
        const fresh = nextLearner()

        const taken = await doors().post("/auth/signup", { email: registered.email, password: registered.password })
        const short = await doors().post<RefusalBody>("/auth/signup", { email: fresh.email, password: "12345" })

        expect(taken.status).toBe(204)
        expect([short.status, short.body.code]).toEqual([400, "IDENTITY_PASSWORD_INVALID"])
    })
})
