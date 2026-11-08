import { createHash, randomBytes, randomInt } from "node:crypto"
import type { RelayPlatform } from "./relay.contracts"

/** The alphabet of a user code: no 0/O, 1/I/L, so a code read aloud is typed right. */
const USER_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"
const USER_CODE_HALF = 4
const PLATFORMS: ReadonlyArray<RelayPlatform> = ["windows", "macos", "linux"]
const NAME_MAX = 60

/** 256 unpredictable bits, for a device code or a device token. */
export const relaySecret = (): string => randomBytes(32).toString("base64url")

/** The one-way digest stored in place of a device code or a device token. */
export const relayDigest = (secret: string): string => createHash("sha256").update(secret).digest("hex")

/** Four random characters of the unambiguous alphabet. */
const codeHalf = (): string =>
    Array.from({ length: USER_CODE_HALF }, () => USER_CODE_ALPHABET[randomInt(USER_CODE_ALPHABET.length)]).join("")

/** A fresh user code, `XXXX-XXXX` over the unambiguous alphabet. */
export const userCodeOf = (): string => `${codeHalf()}-${codeHalf()}`

/** A typed user code in its stored form (upper case, the dash restored), or null when it cannot be one. */
export const normalizedUserCode = (typed: string): string | null => {
    const compact = typed.toUpperCase().replaceAll(/[\s-]/g, "")
    if (compact.length !== USER_CODE_HALF * 2) return null
    if ([...compact].some((char) => !USER_CODE_ALPHABET.includes(char))) return null
    return `${compact.slice(0, USER_CODE_HALF)}-${compact.slice(USER_CODE_HALF)}`
}

/** True when the token text has the shape of a device token this capability mints. */
export const deviceTokenShaped = (token: string): boolean => /^[A-Za-z0-9_-]{43}$/.test(token)

/** The trimmed device name, or null when it is empty, too long or carries a control character. */
export const deviceNameOf = (name: string): string | null => {
    const trimmed = name.trim()
    if (trimmed === "" || trimmed.length > NAME_MAX) return null
    return [...trimmed].some((char) => char < " " || char === "\u007f") ? null : trimmed
}

/** The platform a CLI reported, or null when it is none of the supported ones. */
export const platformOf = (platform: string): RelayPlatform | null =>
    PLATFORMS.find((known) => known === platform.toLowerCase()) ?? null
