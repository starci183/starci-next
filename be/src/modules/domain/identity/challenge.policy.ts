import { randomInt } from "node:crypto"
import { keyedDigest } from "./secret.policy"

/** The password length bounds, in UTF-16 units as the provider counts them. */
export const PASSWORD_MIN_LENGTH = 6
/** The longest password accepted. */
export const PASSWORD_MAX_LENGTH = 256
/** The shortest username accepted. */
export const USERNAME_MIN_LENGTH = 3
/** The longest username accepted. */
export const USERNAME_MAX_LENGTH = 100

/** Draws one unpredictable six-digit code. */
export const generateCode = (): string => randomInt(0, 1_000_000).toString().padStart(6, "0")

/** The stored digest of a code, keyed and bound to its challenge so it cannot be guessed offline or moved. */
export const codeDigest = (key: Buffer, challengeDigest: string, code: string): string =>
    keyedDigest(key, challengeDigest, code)

/** The canonical form of an account email. */
export const normalizeEmail = (email: string): string => email.trim().toLowerCase()

/** Shows enough of an email for the learner to recognise it: `a***@example.com`. */
export const maskEmail = (email: string): string => {
    const at = email.lastIndexOf("@")
    return at < 1 ? "***" : `${email.slice(0, 1)}***${email.slice(at)}`
}

/** True when a password is 6 to 256 characters. */
export const passwordAcceptable = (password: string): boolean =>
    password.length >= PASSWORD_MIN_LENGTH && password.length <= PASSWORD_MAX_LENGTH

/** True when a username is 3 to 100 characters. */
export const usernameAcceptable = (username: string): boolean =>
    username.length >= USERNAME_MIN_LENGTH && username.length <= USERNAME_MAX_LENGTH

/** The instant a challenge opened at `now` stops accepting codes. */
export const challengeExpiry = (now: Date, ttlSeconds: number): Date => new Date(now.getTime() + ttlSeconds * 1000)

/** Whole minutes a code stays valid, at least one, for the mail text. */
export const minutesLeft = (expiresAt: Date, now: Date): number =>
    Math.max(1, Math.ceil((expiresAt.getTime() - now.getTime()) / 60_000))
