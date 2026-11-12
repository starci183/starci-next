/** The tone of the one notice above the form. */
export type AuthNoticeTone = "affirmative" | "negative" | "cautionary"

/** The countdown of a rate-limited answer: when it ends, the locale and the words around the digits. */
export type AuthRetry = {
    readonly until: string
    readonly locale: string
    readonly template: string
    readonly expired: string
}

/** The message under each field of the forms, or undefined for a field with no refusal. */
export type FieldErrors = {
    readonly emailError: string | undefined
    readonly passwordError: string | undefined
    readonly confirmError: string | undefined
    readonly codeError: string | undefined
}
