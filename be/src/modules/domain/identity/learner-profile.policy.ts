/** The longest display name a session keeps, in characters. */
export const DISPLAY_NAME_MAX_LENGTH = 120

/** The longest email a session keeps, in characters (RFC 5321). */
export const EMAIL_MAX_LENGTH = 254

/** The untrusted text claims a verified provider token may carry about the learner. */
export interface ProfileClaims {
    /** The `preferred_username` claim. */
    readonly username: unknown
    /** The `name` claim. */
    readonly name: unknown
    /** The `email` claim. */
    readonly email: unknown
}

/** What a session shows of the learner: clean text or null, never a claim as the provider sent it. */
export interface LearnerProfile {
    /** The name the header shows, or null when the token carried none usable. */
    readonly displayName: string | null
    /** The learner's email, or null when the token carried none usable. */
    readonly email: string | null
}

const INVISIBLE = /[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]/gu
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+$/u

/** Cleans one claim: a string with control and invisible characters removed and the ends trimmed, or null when nothing is left. */
const cleaned = (claim: unknown): string | null => {
    if (typeof claim !== "string") return null
    const text = claim.replaceAll(INVISIBLE, "").trim()
    return text.length === 0 ? null : text
}

/** The first usable claim, cut to the cap in characters (never in the middle of one). */
const displayNameOf = (claims: ReadonlyArray<unknown>): string | null => {
    for (const claim of claims) {
        const text = cleaned(claim)
        if (text !== null) return Array.from(text).slice(0, DISPLAY_NAME_MAX_LENGTH).join("").trim()
    }
    return null
}

/** An email is kept whole or not at all: a cut address would belong to someone else. */
const emailOf = (claim: unknown): string | null => {
    const text = cleaned(claim)
    return text !== null && EMAIL_SHAPE.test(text) && Array.from(text).length <= EMAIL_MAX_LENGTH ? text : null
}

/** Maps the claims of a verified token to the profile a session stores: `preferred_username`, else `name`; the email as sent. */
export const toLearnerProfile = (claims: ProfileClaims): LearnerProfile => ({
    displayName: displayNameOf([claims.username, claims.name]),
    email: emailOf(claims.email),
})
