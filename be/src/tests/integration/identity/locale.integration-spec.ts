import { learnersOf } from "../../fixtures/builders/identity.builder"
import { identityDoors } from "../../world/identity-doors.client"
import { identityModules } from "../../world/identity-world.options"
import { useTestWorld } from "../../world/use-test-world"

/** identity code-mail language (integration): the language of the emailed code follows the Accept-Language header of the door. */
describe("identity code-mail language (integration)", () => {
    const world = useTestWorld({ modules: identityModules, apps: ["core"] })
    const doors = () => identityDoors(world)
    const nextLearner = learnersOf("a7")

    beforeEach(() => doors().reset())

    it("mails the code in the language of Accept-Language, Vietnamese by default", async () => {
        const english = nextLearner()
        const fallback = nextLearner()
        await doors().seed(english)
        await doors().seed(fallback)

        await doors().post(
            "/api/identity/sign-in",
            { identifier: english.username, password: english.password },
            { "accept-language": "en-GB,en;q=0.8" },
        )
        await doors().post("/api/identity/sign-in", { identifier: fallback.username, password: fallback.password })

        const englishMail = await world.mail.waitFor(english.email)
        const vietnameseMail = await world.mail.waitFor(fallback.email)
        expect(englishMail?.subject).toMatch(/^Your StarCi sign-in code: \d{6}$/u)
        expect(vietnameseMail?.subject).toMatch(/StarCi: \d{6}$/u)
        expect(vietnameseMail?.subject).not.toMatch(/^Your/u)
    })
})
