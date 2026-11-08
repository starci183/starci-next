import type { Locale } from "@modules/platform/i18n"

/** Values the sign-up door passes on; the domain decides what they mean. */
export interface SignUpRequest {
    /** The address to register. */
    readonly email: string
    /** The chosen password. */
    readonly password: string
    /** An optional username. */
    readonly username?: string
    /** The learner accepted the terms. */
    readonly acceptTerms: true
    /** The language of the code mail, from the request. */
    readonly locale: Locale
}
