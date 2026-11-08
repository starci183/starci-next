import { learnersOf, type SessionBody } from "../../fixtures/builders/identity.builder"
import { identityDoors } from "../../world/identity-doors.client"
import { identityModules } from "../../world/identity-world.options"
import { useTestWorld } from "../../world/use-test-world"

/**
 * identity social profile (integration): a session issued by the social code flow answers the learner's display name and
 * verified email, and nulls when the provider's token carries neither.
 */
describe("identity social profile (integration)", () => {
    const world = useTestWorld({ modules: identityModules, apps: ["core"] })
    const doors = () => identityDoors(world)
    const nextLearner = learnersOf("a6e")

    beforeEach(() => doors().reset())

    it("reads the account name and the verified email of a social session", async () => {
        const learner = nextLearner()
        await doors().seed(learner)
        const cookie = await doors().signInSocial("github", { email: learner.email })

        const read = await doors().get<SessionBody>("/api/identity/session", { cookie })

        expect(read.status).toBe(200)
        expect(read.body.identity).toMatchObject({ displayName: learner.username, email: learner.email })
    })

    it("reads null name and email for a social session whose token carries none", async () => {
        const cookie = await doors().signInSocial("facebook")

        const read = await doors().get<SessionBody>("/api/identity/session", { cookie })

        expect(read.status).toBe(200)
        expect(read.body.identity).toMatchObject({ displayName: null, email: null })
    })
})
