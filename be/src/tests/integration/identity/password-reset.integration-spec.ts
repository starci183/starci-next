import {
    SESSION_DELETED,
    keysOf,
    learnersOf,
    type ChallengeBody,
    type RefusalBody,
} from "../../fixtures/builders/identity.builder"
import { identityDoors } from "../../world/identity-doors.client"
import { identityModules } from "../../world/identity-world.options"
import { useTestWorld } from "../../world/use-test-world"

/**
 * identity password-reset doors (integration): the answer is the same for registered and unknown emails and only a
 * registered one is mailed; the code changes the password at the provider and revokes every session of the learner.
 */
describe("identity password-reset doors (integration)", () => {
    const world = useTestWorld({ modules: identityModules, apps: ["core"] })
    const doors = () => identityDoors(world)
    const nextLearner = learnersOf("a4")

    beforeEach(() => doors().reset())

    it("answers the same for registered and unknown emails, mailing only the registered one", async () => {
        const learner = nextLearner()
        await doors().seed(learner)

        const known = await doors().post<ChallengeBody>("/api/identity/password-reset", { email: learner.email })
        const unknown = await doors().post<ChallengeBody>("/api/identity/password-reset", {
            email: "nobody@starci.test",
        })

        expect([known.status, unknown.status]).toEqual([200, 200])
        expect([keysOf(known.body), keysOf(unknown.body)]).toEqual(Array(2).fill(["challenge", "expiresAt"]))
        expect(await world.mail.messages(learner.email)).toHaveLength(1)
        expect(await world.mail.messages()).toHaveLength(1)
    })

    it("resets the password with the code and revokes every session of the learner", async () => {
        const learner = nextLearner()
        const renewed = `${learner.password}-renewed`
        const cookie = await doors().signIn(learner)
        const reset = await doors().post<ChallengeBody>("/api/identity/password-reset", { email: learner.email })
        const code = await doors().codeSentTo(learner.email)
        const verify = (password: string) =>
            doors().post<RefusalBody>("/api/identity/password-reset/verify", {
                challenge: reset.body.challenge,
                code,
                password,
            })

        const short = await verify("12345")
        const done = await verify(renewed)
        const session = await doors().get("/api/identity/session", { cookie })

        expect([short.status, short.body.code]).toEqual([400, "IDENTITY_PASSWORD_INVALID"])
        expect(done.status).toBe(204)
        await expect(doors().idp.passwordMatches(learner.username, renewed)).resolves.toBe(true)
        expect([session.status, session.headers["set-cookie"]]).toEqual([401, SESSION_DELETED])
    })
})
