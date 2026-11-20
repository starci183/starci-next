/** The tone of the one notice above the form. */
export type AuthNoticeTone = "affirmative" | "negative" | "cautionary"

/** The message under each field of the forms, or undefined for a field with no refusal. */
export type FieldErrors = {
    readonly emailError: string | undefined
    readonly passwordError: string | undefined
    readonly confirmError: string | undefined
}
