import { MailError as PackageMailError } from "@starci/mail"
import { Test } from "@nestjs/testing"
import { MailError, MailErrorCode } from "./errors/mail.error"
import { toMailError } from "./mail-failure.mapper"

const MAPPER: unique symbol = Symbol("integrations.mail.failure-mapper")
const mappers = { toMailError }

describe("mail failure mapper", () => {
    let subject: typeof mappers
    beforeEach(async () => {
        const moduleRef = await Test.createTestingModule({
            providers: [{ provide: MAPPER, useFactory: () => mappers }],
        }).compile()
        subject = moduleRef.get<typeof mappers>(MAPPER)
    })

    it.each([
        ["MAIL_AUTH", MailErrorCode.Auth],
        ["MAIL_APP_PASSWORD", MailErrorCode.Auth],
        ["MAIL_CONNECT", MailErrorCode.Connect],
        ["MAIL_TIMEOUT", MailErrorCode.Timeout],
        ["MAIL_DNS", MailErrorCode.Connect],
        ["MAIL_TLS", MailErrorCode.Tls],
        ["MAIL_SENDER", MailErrorCode.MessageInvalid],
        ["MAIL_RECIPIENT", MailErrorCode.Recipient],
        ["MAIL_LIMIT", MailErrorCode.Connect],
        ["MAIL_UNKNOWN", MailErrorCode.Connect],
        ["MAIL_ADDRESS_INVALID", MailErrorCode.AddressInvalid],
        ["MAIL_MESSAGE_INVALID", MailErrorCode.MessageInvalid],
    ] as const)("names the package code %s as %s", (packageCode, expected) => {
        const cause = new PackageMailError(packageCode)

        const mapped = subject.toMailError(cause)

        expect(mapped).toBeInstanceOf(MailError)
        expect(mapped.code).toBe(expected)
        expect(mapped.cause).toBe(cause)
    })

    it("answers the server unreachable for a failure that is not the package's", () => {
        const cause = new Error("socket hang up")

        expect(subject.toMailError(cause).code).toBe(MailErrorCode.Connect)
    })

    it("keeps an error that is already the boundary's", () => {
        const own = new MailError({ code: MailErrorCode.Tls })

        expect(subject.toMailError(own)).toBe(own)
    })
})
