import type { Locale } from "@modules/platform/i18n"

/** Values the sign-in door passes on; the domain decides what they mean. */
export interface SignInRequest {
    /** The email or username. */
    readonly identifier: string
    /** The password, checked by the provider and never stored. */
    readonly password: string
    /** The language of the code mail, from the request. */
    readonly locale: Locale
}
