import type { Locale } from "@modules/platform/i18n"

/** Values the request-password-reset door passes on; the domain decides what they mean. */
export interface RequestPasswordResetRequest {
    /** The address asking for a reset. */
    readonly email: string
    /** The language of the code mail, from the request. */
    readonly locale: Locale
}
