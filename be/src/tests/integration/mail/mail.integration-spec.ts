import { MAIL_PORT, MailErrorCode, renderTransactional, type Mailer } from "@modules/integrations/mail"
import { mailModules } from "../../world/mail-world.options"
import { useTestWorld } from "../../world/use-test-world"

const codeMail = () =>
    renderTransactional({
        lang: "en",
        subject: "Your StarCi code",
        brand: { name: "StarCi" },
        paragraphs: ["Your sign-in code is 123456."],
    })

/**
 * mail (integration): the mail integration registered against the world's real mail sink. It proves a rendered message reaches the
 * sink, and that a server that refuses a recipient or never answers surfaces as the boundary's coded MailError (MailErrorCode).
 */
describe("mail (integration)", () => {
    const world = useTestWorld({ modules: mailModules })
    const mailer = (): Mailer => world.resolve<Mailer>(MAIL_PORT)

    it("delivers a rendered message to the sink from the configured sender", async () => {
        const sent = await mailer().send({ to: "ada@example.test", message: codeMail() })

        const mail = await world.mail.waitFor("ada@example.test", { subject: "Your StarCi code" })
        expect(sent.accepted).toEqual(["ada@example.test"])
        expect(mail.to.map((party) => party.address)).toEqual(["ada@example.test"])
        expect(mail.from.address).toBe("no-reply@starci.test")
        expect(mail.text).toContain("123456")
    })

    it("refuses a recipient the server refuses with MAIL_RECIPIENT", async () => {
        await world.mail.refuse("recipient", { status: 550 })

        try {
            await expect(mailer().send({ to: "ghost@example.test", message: codeMail() })).rejects.toMatchObject({
                code: MailErrorCode.Recipient,
            })
        } finally {
            await world.mail.acceptAll()
        }
        expect(await world.mail.messages("ghost@example.test")).toHaveLength(0)
    })

    it("reports a server that never answers as unavailable with MAIL_TIMEOUT", async () => {
        await world.infra.mail.stall()

        try {
            await expect(mailer().send({ to: "ada@example.test", message: codeMail() })).rejects.toMatchObject({
                code: MailErrorCode.Timeout,
            })
        } finally {
            await world.infra.mail.restore()
        }
    })

    it("reports a refused connection as unavailable with MAIL_CONNECT", async () => {
        await world.infra.mail.cut()

        try {
            await expect(mailer().send({ to: "ada@example.test", message: codeMail() })).rejects.toMatchObject({
                code: MailErrorCode.Connect,
            })
        } finally {
            await world.infra.mail.restore()
        }
    })

    it("refuses a recipient that is not a mailbox before connecting, with MAIL_ADDRESS_INVALID", async () => {
        await expect(mailer().send({ to: "not-a-mailbox", message: codeMail() })).rejects.toMatchObject({
            code: MailErrorCode.AddressInvalid,
        })
    })
})
