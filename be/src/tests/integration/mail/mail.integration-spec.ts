import { MAILER, renderTransactional, type Mailer } from "@modules/integrations/mail"
import { mailModules } from "../../world/mail-world.options"
import { useTestWorld } from "../../world/use-test-world"

const codeMail = () =>
    renderTransactional({
        lang: "en",
        subject: "Your StarCi link",
        brand: { name: "StarCi" },
        paragraphs: ["Press the button to confirm."],
        action: { label: "Confirm", url: "https://starci.test/auth/confirm?token=abc" },
    })

/** mail (integration): the mail integration registered against the world's real mail sink; a rendered message reaches the sink. */
describe("mail (integration)", () => {
    const world = useTestWorld({ modules: mailModules })
    const mailer = (): Mailer => world.resolve<Mailer>(MAILER)

    it("delivers a rendered message to the sink from the configured sender", async () => {
        const sent = await mailer().send({ to: "ada@example.test", message: codeMail() })

        const mail = await world.mail.waitFor("ada@example.test", { subject: "Your StarCi link" })
        expect(sent.accepted).toEqual(["ada@example.test"])
        expect(mail.to.map((party) => party.address)).toEqual(["ada@example.test"])
        expect(mail.from.address).toBe("no-reply@starci.test")
        expect(mail.text).toContain("https://starci.test/auth/confirm?token=abc")
    })
})
