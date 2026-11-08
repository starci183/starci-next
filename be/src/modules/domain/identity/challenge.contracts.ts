import type { Locale } from "@modules/platform/i18n"
import type { SessionIssued } from "./session.contracts"

/** A page path the caller asked to return to; absent when the caller named none. */
export type OptionalReturnTo = string | undefined

/** What an emailed code completes. */
export type ChallengePurpose = "sign-in" | "sign-up" | "password-reset"

/** The sealed payload of a sign-in challenge: the verified provider answer awaiting the code. */
export interface SignInPayload {
    /** The provider's stable subject. */
    readonly subject: string
    /** Roles asserted by the verified token. */
    readonly roles: ReadonlyArray<string>
    /** The cleaned display name of the learner, or null. */
    readonly displayName: string | null
    /** The cleaned email of the learner, or null. */
    readonly email: string | null
    /** The provider refresh token. */
    readonly refreshToken: string
    /** When the refresh token stops working, RFC3339. */
    readonly refreshExpiresAt: string
}

/** The sealed payload of a sign-up challenge: the account to create once its email is confirmed. */
export interface SignUpPayload {
    /** The account email. */
    readonly email: string
    /** The username to create the account under (the email when the learner chose none). */
    readonly username: string
    /** The password the learner chose. */
    readonly password: string
}

/** The sealed payload of a reset challenge; the subject is null for an email that has no account. */
export interface ResetPayload {
    /** The provider subject whose password the code may reset, or null. */
    readonly subject: string | null
}

/** Everything needed to open one challenge. */
export interface IssueChallengeParams {
    /** What the code completes. */
    readonly purpose: ChallengePurpose
    /** The account email the code is sent to. */
    readonly email: string
    /** The language of the mail, kept for resends. */
    readonly locale: Locale
    /** False for an email that has no account, so nothing is mailed and the answer stays the same. */
    readonly deliver: boolean
    /** The payload to seal; it comes back only to the winner of a correct code. */
    readonly payload: SignInPayload | SignUpPayload | ResetPayload
}

/** A challenge just opened. */
export interface IssuedChallenge {
    /** The raw opaque challenge reference. */
    readonly challenge: string
    /** The raw six-digit code; it is mailed and never stored. */
    readonly code: string
    /** When the challenge stops accepting codes. */
    readonly expiresAt: Date
}

/** The winner of a correct code. */
export interface ClaimedChallenge {
    /** The account email. */
    readonly email: string
    /** The unsealed payload text, read by the purpose's reader. */
    readonly payload: string
}

/** A challenge whose code was rotated for a resend. */
export interface RotatedChallenge {
    /** The new raw six-digit code. */
    readonly code: string
    /** What the code completes. */
    readonly purpose: ChallengePurpose
    /** The account email. */
    readonly email: string
    /** The language of the mail. */
    readonly locale: Locale
    /** False when nothing may be mailed. */
    readonly deliver: boolean
    /** The unchanged expiry. */
    readonly expiresAt: Date
}

/** The answer to a sign-in or sign-up step. */
export interface ChallengeView {
    /** The opaque challenge reference the verify door takes back. */
    readonly challenge: string
    /** The masked email the code went to. */
    readonly email: string
    /** When the challenge stops accepting codes. */
    readonly expiresAt: Date
}

/** The answer to a password-reset request, identical for any email. */
export interface ResetChallengeView {
    /** The opaque challenge reference. */
    readonly challenge: string
    /** When the challenge stops accepting codes. */
    readonly expiresAt: Date
}

/** A password sign-in step one. */
export interface SignInInput {
    /** Email or username. */
    readonly identifier: string
    /** The password. */
    readonly password: string
    /** The language of the mail; Vietnamese when absent. */
    readonly locale?: Locale
}

/** A code entered for a challenge. */
export interface VerifyCodeInput {
    /** The challenge reference. */
    readonly challenge: string
    /** The six-digit code. */
    readonly code: string
}

/** A code request for an existing challenge. */
export interface ResendInput {
    /** The challenge reference. */
    readonly challenge: string
}

/** Account creation. */
export interface SignUpInput {
    /** The account email. */
    readonly email: string
    /** The password, 6 to 256 characters. */
    readonly password: string
    /** An optional username, 3 to 100 characters; the email when absent. */
    readonly username?: string
    /** The terms were accepted. */
    readonly acceptTerms: true
    /** The language of the mail; Vietnamese when absent. */
    readonly locale?: Locale
}

/** A password reset request. */
export interface PasswordResetInput {
    /** The account email. */
    readonly email: string
    /** The language of the mail; Vietnamese when absent. */
    readonly locale?: Locale
}

/** A reset completion. */
export interface PasswordResetVerifyInput extends VerifyCodeInput {
    /** The new password, 6 to 256 characters. */
    readonly password: string
}

/** A social sign-in start. */
export interface SocialStartInput {
    /** The provider the learner chose; untrusted until it is one of the offered providers. */
    readonly provider: string
    /** The page to return to; anything but a safe same-origin path becomes `/`. */
    readonly returnTo?: OptionalReturnTo
}

/** A social sign-in completion. */
export interface SocialExchangeInput {
    /** The one-use authorization code. */
    readonly code: string
    /** The state issued at start. */
    readonly state: string
    /** The state the browser's pre-authentication cookie carries; it must equal `state`, or the exchange refuses. */
    readonly binding: string | undefined
}

/** A session just issued by a social sign-in, with the page to return to. */
export interface SocialSessionIssued extends SessionIssued {
    /** The bundle's validated same-origin path, or `/`. */
    readonly returnTo: string
}

/** The provider destination of a social start, and the browser binding the exchange will require. */
export interface SocialStarted {
    /** The Keycloak authorization URL with the provider hint and S256 challenge. */
    readonly authorizationUrl: string
    /** The state the pre-authentication cookie binds to this browser; never sent in a response body. */
    readonly binding: string
    /** How long the binding cookie lives: the bundle's own lifetime. */
    readonly bindingMaxAgeSeconds: number
}

/** The material a social start keeps for the callback. */
export interface SocialBundle {
    /** The raw state sent to the provider. */
    readonly state: string
    /** The nonce the ID token must carry. */
    readonly nonce: string
    /** The S256 challenge of the stored verifier. */
    readonly codeChallenge: string
    /** How long the bundle stays claimable, in seconds. */
    readonly maxAgeSeconds: number
}

/** The material a claimed social bundle returns to its winner. */
export interface ClaimedSocialBundle {
    /** The nonce the ID token must carry. */
    readonly nonce: string
    /** The confidential PKCE verifier. */
    readonly codeVerifier: string
    /** The validated page to return to. */
    readonly returnTo: string
}

/** What one code mail needs. */
export interface CodeMailParams {
    /** The recipient mailbox. */
    readonly email: string
    /** What the code completes. */
    readonly purpose: ChallengePurpose
    /** The language of the mail. */
    readonly locale: Locale
    /** The raw six-digit code. */
    readonly code: string
    /** When the code stops working. */
    readonly expiresAt: Date
}
