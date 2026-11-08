import { Test } from "@nestjs/testing"
import { FakeClock, mock } from "@starci/jest-preset"
import { MAIL_PORT } from "@modules/integrations/mail"
import type { Mailer } from "@modules/integrations/mail"
import { CLOCK } from "@modules/platform/clock"
import { MESSAGE_CATALOG } from "@modules/platform/i18n"
import type { MessageCatalog } from "@modules/platform/i18n"
import { CodeMailService } from "./code-mail.service"
import { IdentityErrorCode } from "./errors/identity.error"

const build = async () => {
    const mailer = mock<Mailer>()
    const catalog = mock<MessageCatalog>()
    catalog.get.mockImplementation((key, params, locale) => `${locale}|${key}|${params.code}|${params.minutes}`)
    const moduleRef = await Test.createTestingModule({
        providers: [
            CodeMailService,
            { provide: MAIL_PORT, useValue: mailer },
            { provide: MESSAGE_CATALOG, useValue: catalog },
            { provide: CLOCK, useValue: new FakeClock("2026-01-01T00:00:00.000Z") },
        ],
    }).compile()
    return { service: moduleRef.get(CodeMailService), mailer }
}
const PARAMS = {
    email: "ada@example.com",
    purpose: "sign-in",
    locale: "vi",
    code: "123456",
    expiresAt: new Date("2026-01-01T00:10:00.000Z"),
} as const

describe("CodeMailService", () => {
    describe("send", () => {
        it("mails the code once to the account in the receiver's language with the minutes left", async () => {
            const { service, mailer } = await build()
            mailer.send.mockResolvedValue({ messageId: "m-1", accepted: ["ada@example.com"] })
            await service.send(PARAMS)
            expect(mailer.send.mock.calls).toEqual([
                [
                    {
                        to: "ada@example.com",
                        message: {
                            subject: "vi|mail.code.sign-in.subject|123456|10",
                            text: "vi|mail.code.sign-in.text|123456|10",
                        },
                    },
                ],
            ])
        })
        it("refuses as provider unavailable when the mail server does not accept the message", async () => {
            const { service, mailer } = await build()
            const cause = new Error("smtp down")
            mailer.send.mockRejectedValue(cause)
            await expect(service.send(PARAMS)).rejects.toMatchObject({
                code: IdentityErrorCode.ProviderUnavailable,
                cause,
            })
        })
    })
})
