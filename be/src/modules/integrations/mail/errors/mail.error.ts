import { DomainError, type ErrorKind } from "@modules/platform/errors"

/** The codes a mail send rejects with, the boundary's own names for what `@starci/mail` reports. */
export enum MailErrorCode {
    /** The mail server refused the login. */
    Auth = "MAIL_AUTH",
    /** The mail server could not be reached or dropped the connection. */
    Connect = "MAIL_CONNECT",
    /** The mail server did not answer in time. */
    Timeout = "MAIL_TIMEOUT",
    /** The secure connection failed or the server offers none while one is required. */
    Tls = "MAIL_TLS",
    /** The server refused the recipient address. */
    Recipient = "MAIL_RECIPIENT",
    /** An address is not a mailbox the package sends to. */
    AddressInvalid = "MAIL_ADDRESS_INVALID",
    /** The message is not one the package sends. */
    MessageInvalid = "MAIL_MESSAGE_INVALID",
}

/** Transport kinds of the mail codes. */
export const MAIL_ERROR_KINDS: Record<MailErrorCode, ErrorKind> = {
    [MailErrorCode.Auth]: "unavailable",
    [MailErrorCode.Connect]: "unavailable",
    [MailErrorCode.Timeout]: "unavailable",
    [MailErrorCode.Tls]: "unavailable",
    [MailErrorCode.Recipient]: "invalid",
    [MailErrorCode.AddressInvalid]: "invalid",
    [MailErrorCode.MessageInvalid]: "invalid",
}

/** The mail boundary's error: a stable code and the underlying cause, for a caller that maps a failed send to its own code. */
export class MailError extends DomainError<MailErrorCode> {}
