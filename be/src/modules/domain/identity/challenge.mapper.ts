import { isRecord } from "@modules/platform/primitives"
import type { Locale, MessageCatalog } from "@modules/platform/i18n"
import type {
    ChallengePurpose,
    ChallengeView,
    IssuedChallenge,
    ResetChallengeView,
    ResetPayload,
    RotatedChallenge,
    SignInPayload,
    SignUpPayload,
} from "./challenge.contracts"
import { maskEmail } from "./challenge.policy"
import { IdentityError, IdentityErrorCode } from "./errors/identity.error"
import type { ChallengeRotatedRow } from "./persistence/challenges.rows"
import type { SessionTokens } from "./session.contracts"

/** The subject and text of one code mail, already in the receiver's language. */
export interface CodeMail {
    /** The one-line subject. */
    readonly subject: string
    /** The plain-text body. */
    readonly text: string
}

const PURPOSES: ReadonlyArray<ChallengePurpose> = ["sign-in", "sign-up", "password-reset"]
const LOCALES: ReadonlyArray<Locale> = ["vi", "en"]

const corrupt = (cause?: unknown): IdentityError =>
    new IdentityError({ code: IdentityErrorCode.SessionUnavailable, cause })

const parseRecord = (text: string): Record<string, unknown> => {
    let value: unknown
    try {
        value = JSON.parse(text)
    } catch (cause) {
        throw corrupt(cause)
    }
    if (!isRecord(value)) throw corrupt()
    return value
}

const isStringList = (value: unknown): value is ReadonlyArray<string> =>
    Array.isArray(value) && value.every((item) => typeof item === "string")

/** Reads the sealed payload of a sign-in challenge; anything else is corrupt state. */
export const readSignInPayload = (text: string): SignInPayload => {
    const value = parseRecord(text)
    const { subject, roles, refreshToken, refreshExpiresAt } = value
    const { displayName, email } = value
    if (
        typeof subject !== "string" ||
        !isStringList(roles) ||
        typeof refreshToken !== "string" ||
        typeof refreshExpiresAt !== "string"
    )
        throw corrupt()
    return {
        subject,
        roles,
        displayName: typeof displayName === "string" ? displayName : null,
        email: typeof email === "string" ? email : null,
        refreshToken,
        refreshExpiresAt,
    }
}

/** Reads the sealed payload of a sign-up challenge; anything else is corrupt state. */
export const readSignUpPayload = (text: string): SignUpPayload => {
    const { email, username, password } = parseRecord(text)
    if (typeof email !== "string" || typeof username !== "string" || typeof password !== "string") throw corrupt()
    return { email, username, password }
}

/** Reads the sealed payload of a reset challenge; anything else is corrupt state. */
export const readResetPayload = (text: string): ResetPayload => {
    const { subject } = parseRecord(text)
    if (typeof subject !== "string" && subject !== null) throw corrupt()
    return { subject }
}

/** The sign-in payload that carries a verified provider answer through the code step. */
export const toSignInPayload = (tokens: SessionTokens): SignInPayload => ({
    subject: tokens.subject,
    roles: tokens.roles,
    displayName: tokens.displayName,
    email: tokens.email,
    refreshToken: tokens.refreshToken,
    refreshExpiresAt: tokens.refreshExpiresAt.toISOString(),
})

/** The session material a sign-in payload carries; a malformed expiry is corrupt state. */
export const toSessionTokens = (payload: SignInPayload): SessionTokens => {
    const refreshExpiresAt = new Date(payload.refreshExpiresAt)
    if (Number.isNaN(refreshExpiresAt.getTime())) throw corrupt()
    return {
        subject: payload.subject,
        roles: payload.roles,
        displayName: payload.displayName,
        email: payload.email,
        refreshToken: payload.refreshToken,
        refreshExpiresAt,
    }
}

/** What a sign-in or sign-up answers: the reference, the masked email and the expiry. */
export const toChallengeView = (issued: IssuedChallenge, email: string): ChallengeView => ({
    challenge: issued.challenge,
    email: maskEmail(email),
    expiresAt: issued.expiresAt,
})

/** What a reset request answers, the same for any email. */
export const toResetChallengeView = (issued: IssuedChallenge): ResetChallengeView => ({
    challenge: issued.challenge,
    expiresAt: issued.expiresAt,
})

/** Narrows a rotated row to its typed form; a purpose or language outside the closed sets is corrupt state. */
export const toRotatedChallenge = (row: ChallengeRotatedRow, code: string): RotatedChallenge => {
    const purpose = PURPOSES.find((candidate) => candidate === row.purpose)
    const locale = LOCALES.find((candidate) => candidate === row.locale)
    if (purpose === undefined || locale === undefined) throw corrupt()
    return { code, purpose, email: row.email, locale, deliver: row.deliver, expiresAt: row.expires_at }
}

/** Draws the code mail of one purpose from the catalog in the receiver's language. */
export const toCodeMail = (
    catalog: MessageCatalog,
    purpose: ChallengePurpose,
    locale: Locale,
    code: string,
    minutes: number,
): CodeMail => ({
    subject: catalog.get(`mail.code.${purpose}.subject`, { code, minutes }, locale),
    text: catalog.get(`mail.code.${purpose}.text`, { code, minutes }, locale),
})
