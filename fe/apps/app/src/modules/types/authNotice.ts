/** The tone of the one notice above the form. */
export type AuthNoticeTone = "affirmative" | "negative" | "cautionary"

/** The one notice above the form: its tone, its title and, for a refusal that has a next step, the line that names it. */
export type AuthNoticeView = {
    readonly tone: AuthNoticeTone
    readonly title: string
    readonly description: string | undefined
}

/** The message under each field of the forms, or undefined for a field with no refusal. */
export type FieldErrors = {
    readonly emailError: string | undefined
    readonly passwordError: string | undefined
    readonly confirmError: string | undefined
}
