import { keysOf, learnersOf, type GrantBody, type RefusalBody } from "../../fixtures/builders/learner.builder"
import { identityDoors } from "../../world/identity-doors.client"
import { identityModules } from "../../world/identity-world.options"
import { useTestWorld } from "../../world/use-test-world"

/**
 * identity sign-in doors (integration): the real core app and the SMTP fake. It proves a confirmed account signs in with
 * email and password, that the answer is an access token and the refresh token travels only as an httpOnly cookie, that
 * refusals are generic, and that an unconfirmed mailbox cannot sign in.
 */
describe("identity sign-in doors (integration)", () => {
    const world = useTestWorld({ modules: identityModules, apps: ["core"] })
    const doors = () => identityDoors(world)
    const nextLearner = learnersOf("a1")

    beforeEach(() => doors().reset())

    it("signs in with email and password: an access token in the body, the refresh token only as an httpOnly cookie", async () => {
        const learner = nextLearner()
        await doors().register(learner)
        const before = await doors().activeSessions()

        const login = await doors().post<GrantBody>("/auth/login", { email: learner.email, password: learner.password })

        expect(login.status).toBe(200)
        expect(keysOf(login.body)).toEqual(["accessToken", "expiresAt", "expiresIn", "user"])
        expect(login.body.user).toMatchObject({ email: learner.email })
        expect(login.headers["set-cookie"]).toMatch(/refresh_token=[^;]+;.*HttpOnly/iu)
        expect(JSON.stringify(login.body)).not.toMatch(/refresh|password/iu)
        await expect(doors().activeSessions()).resolves.toBe(before + 1)
    })

    it("refuses a wrong password like an unknown account", async () => {
        const learner = nextLearner()
        await doors().register(learner)

        const wrong = await doors().post<RefusalBody>("/auth/login", {
            email: learner.email,
            password: `${learner.password}x`,
        })
        const unknown = await doors().post<RefusalBody>("/auth/login", {
            email: "nobody-here@starci.test",
            password: learner.password,
        })

        expect([wrong.status, wrong.body.code]).toEqual([401, "IDENTITY_INVALID_CREDENTIALS"])
        expect(unknown.body).toEqual(wrong.body)
        expect(wrong.headers["set-cookie"]).toBeUndefined()
    })

    it("refuses an account whose mailbox was never confirmed", async () => {
        const learner = nextLearner()
        await doors().post("/auth/signup", { email: learner.email, password: learner.password })

        const login = await doors().post<RefusalBody>("/auth/login", {
            email: learner.email,
            password: learner.password,
        })

        expect([login.status, login.body.code]).toEqual([403, "IDENTITY_EMAIL_NOT_CONFIRMED"])
    })
})
