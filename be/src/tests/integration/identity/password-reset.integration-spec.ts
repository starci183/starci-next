import { learnersOf, type RefusalBody } from "../../fixtures/builders/learner.builder"
import { identityDoors } from "../../world/identity-doors.client"
import { identityModules } from "../../world/identity-world.options"
import { useTestWorld } from "../../world/use-test-world"

/**
 * identity password-reset doors (integration): the answer is the same for registered and unknown emails and only a
 * registered one is mailed; the link sets the new password and ends every session of the learner.
 */
describe("identity password-reset doors (integration)", () => {
    const world = useTestWorld({ modules: identityModules, apps: ["core"] })
    const doors = () => identityDoors(world)
    const nextLearner = learnersOf("a4")

    beforeEach(() => doors().reset())

    it("answers the same for registered and unknown emails, mailing only the registered one", async () => {
        const learner = nextLearner()
        await doors().register(learner)
        await world.mail.clear()

        const known = await doors().post("/auth/forgot", { email: learner.email })
        const unknown = await doors().post("/auth/forgot", { email: "nobody@starci.test" })

        expect([known.status, unknown.status]).toEqual([204, 204])
        expect(await world.mail.messages(learner.email)).toHaveLength(1)
        expect(await world.mail.messages()).toHaveLength(1)
    })

    it("resets the password with the link and ends every session of the learner", async () => {
        const learner = nextLearner()
        const renewed = `${learner.password}-renewed`
        const session = await doors().signInSession(learner)
        await world.mail.clear()
        await doors().post("/auth/forgot", { email: learner.email })
        const token = await doors().linkTokenSentTo(learner.email)

        const weak = await doors().post<RefusalBody>("/auth/reset", { token, password: "short" })
        const done = await doors().post("/auth/reset", { token, password: renewed })
        const old = await doors().post<RefusalBody>("/auth/login", { email: learner.email, password: learner.password })
        const fresh = await doors().post("/auth/login", { email: learner.email, password: renewed })
        const refreshed = await doors().post<RefusalBody>("/auth/refresh", undefined, { cookie: session.refresh })

        expect([weak.status, weak.body.code]).toEqual([400, "IDENTITY_PASSWORD_INVALID"])
        expect(done.status).toBe(204)
        expect([old.status, old.body.code]).toEqual([401, "IDENTITY_INVALID_CREDENTIALS"])
        expect(fresh.status).toBe(200)
        expect([refreshed.status, refreshed.body.code]).toEqual([401, "IDENTITY_REFRESH_INVALID"])
    })
})
