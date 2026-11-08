/** The outcome of one code attempt against a live challenge. */
export interface ChallengeAttemptRow {
    /** True when the code was right and this attempt consumed the challenge. */
    readonly matched: boolean
    /** Wrong attempts the challenge still tolerates. */
    readonly attempts_left: number
    /** The account email. */
    readonly email: string
    /** The sealed payload; present only when the code matched. */
    readonly payload: string | null
}

/** A live challenge whose code was just rotated. */
export interface ChallengeRotatedRow {
    /** What the code completes. */
    readonly purpose: string
    /** The account email. */
    readonly email: string
    /** The language of the mail. */
    readonly locale: string
    /** False when nothing may be mailed. */
    readonly deliver: boolean
    /** The unchanged expiry. */
    readonly expires_at: Date
}

/** The material a claimed social bundle returns. */
export interface SocialBundleRow {
    /** The nonce the ID token must carry. */
    readonly nonce: string
    /** The confidential PKCE verifier. */
    readonly code_verifier: string
    /** The validated page to return to. */
    readonly return_to: string
}
