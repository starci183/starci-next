import { learnersOf } from "../../fixtures/builders/learner.builder"
import { identityDoors } from "../../world/identity-doors.client"
import { identityModules } from "../../world/identity-world.options"
import { useTestWorld } from "../../world/use-test-world"

/** identity link-mail language (integration): the language of the confirmation mail follows the `language` of the sign-up, the default of the app when it names none. */
describe("identity link-mail language (integration)", () => {
    const world = useTestWorld({ modules: identityModules, apps: ["core"] })
    const doors = () => identityDoors(world)
    const nextLearner = learnersOf("a7")

    beforeEach(() => doors().reset())

    it("mails the link in the language the request names, in Vietnamese when it names Vietnamese", async () => {
        const english = nextLearner()
        const vietnamese = nextLearner()

        await doors().post("/auth/signup", { email: english.email, password: english.password, language: "en" })
        await doors().post("/auth/signup", { email: vietnamese.email, password: vietnamese.password, language: "vi" })

        const englishMail = await world.mail.waitFor(english.email)
        const vietnameseMail = await world.mail.waitFor(vietnamese.email)
        expect(englishMail.subject).toBe("Confirm your email")
        expect(vietnameseMail.subject).toBe("Xác nhận email của bạn")
    })
})
