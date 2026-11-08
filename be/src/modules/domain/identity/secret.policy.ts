import { createCipheriv, createDecipheriv, createHmac, hkdfSync, randomBytes } from "node:crypto"
import type { Secret } from "@modules/platform/config"
import { IdentityError, IdentityErrorCode } from "./errors/identity.error"

const IV_BYTES = 12
const TAG_BYTES = 16
const VERSION = "v1"

/** The uses a sealing secret is split into, so one derived key never serves two jobs. */
export type KeyUse = "seal" | "code"

/** Derives the 256-bit key of one use from the configured secret. */
export const deriveKey = (secret: Secret, use: KeyUse): Buffer =>
    Buffer.from(hkdfSync("sha256", secret.reveal(), "starci.identity", `identity.${use}`, 32))

/** Seals a text with AES-256-GCM: `v1.` then base64url of iv, tag and ciphertext. */
export const seal = (plain: string, key: Buffer): string => {
    const iv = randomBytes(IV_BYTES)
    const cipher = createCipheriv("aes-256-gcm", key, iv)
    const body = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()])
    return `${VERSION}.${Buffer.concat([iv, cipher.getAuthTag(), body]).toString("base64url")}`
}

/** Opens a sealed text; a foreign, altered or wrongly keyed value is `SessionUnavailable`. */
export const unseal = (sealed: string, key: Buffer): string => {
    const [version, encoded] = sealed.split(".")
    if (version !== VERSION || encoded === undefined)
        throw new IdentityError({ code: IdentityErrorCode.SessionUnavailable })
    try {
        const bytes = Buffer.from(encoded, "base64url")
        const decipher = createDecipheriv("aes-256-gcm", key, bytes.subarray(0, IV_BYTES))
        decipher.setAuthTag(bytes.subarray(IV_BYTES, IV_BYTES + TAG_BYTES))
        return Buffer.concat([decipher.update(bytes.subarray(IV_BYTES + TAG_BYTES)), decipher.final()]).toString("utf8")
    } catch (cause) {
        throw new IdentityError({ code: IdentityErrorCode.SessionUnavailable, cause })
    }
}

/** A keyed one-way digest of a value inside a scope, so a stored digest cannot be guessed offline. */
export const keyedDigest = (key: Buffer, scope: string, value: string): string =>
    createHmac("sha256", key).update(`${scope}:${value}`).digest("hex")
