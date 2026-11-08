import type { MailOptions as MailSettings } from "@starci/mail"

/** The languages the app writes its mail in. */
export type MailLanguage = "vi" | "en"

/**
 * Outgoing mail parsed once at API boot: the settings of `@starci/mail` and what the app's own mail needs (the product name in
 * the header and the language of a mail whose request names none). The words and layout of each mail belong to the domain that sends it.
 */
export interface MailOptions extends MailSettings {
    /** The product name in the header of every mail. */
    readonly brandName: string
    /** The language of a mail whose request names none. */
    readonly defaultLanguage: MailLanguage
}
