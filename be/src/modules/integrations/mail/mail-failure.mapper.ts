import { MailError as PackageMailError, type MailErrorCode as PackageMailErrorCode } from "@starci/mail"
import { MailError, MailErrorCode } from "./errors/mail.error"

const CODE_BY_PACKAGE_CODE: Readonly<Record<PackageMailErrorCode, MailErrorCode>> = {
    MAIL_AUTH: MailErrorCode.Auth,
    MAIL_APP_PASSWORD: MailErrorCode.Auth,
    MAIL_CONNECT: MailErrorCode.Connect,
    MAIL_TIMEOUT: MailErrorCode.Timeout,
    MAIL_DNS: MailErrorCode.Connect,
    MAIL_TLS: MailErrorCode.Tls,
    MAIL_SENDER: MailErrorCode.MessageInvalid,
    MAIL_RECIPIENT: MailErrorCode.Recipient,
    MAIL_LIMIT: MailErrorCode.Connect,
    MAIL_UNKNOWN: MailErrorCode.Connect,
    MAIL_ADDRESS_INVALID: MailErrorCode.AddressInvalid,
    MAIL_MESSAGE_INVALID: MailErrorCode.MessageInvalid,
}

/** Translates what the mail package threw into this boundary's error; anything that is not the package's coded failure is the server being unreachable. */
export const toMailError = (cause: unknown): MailError =>
    cause instanceof MailError
        ? cause
        : new MailError({
              code: cause instanceof PackageMailError ? CODE_BY_PACKAGE_CODE[cause.code] : MailErrorCode.Connect,
              cause,
          })
