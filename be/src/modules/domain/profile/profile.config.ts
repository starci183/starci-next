import type { EnvSource } from "@modules/platform/config"
import type { ProfileOptions } from "./profile.options"

/** The comma separated content types of a setting, trimmed and in lower case; undefined when the setting is absent or empty. */
const typesOf = (raw: string | undefined): ReadonlyArray<string> | undefined => {
    const types = (raw ?? "")
        .split(",")
        .map((type) => type.trim().toLowerCase())
        .filter((type) => type !== "")
    return types.length === 0 ? undefined : types
}

/** A positive whole number of a setting, or undefined when the setting is absent or not one. */
const countOf = (raw: string | undefined): number | undefined => {
    const count = Number(raw)
    return raw !== undefined && Number.isInteger(count) && count > 0 ? count : undefined
}

/**
 * Reads the profile settings an environment declares, each optional with a default in `profileSettingsOf`:
 * `PROFILE_AVATAR_MAX_BYTES`, `PROFILE_AVATAR_TYPES` (comma separated), `PROFILE_NAME_MAX` and `PROFILE_AVATAR_UPLOAD_TTL_SECONDS`.
 */
export const parseProfileConfig = (env: EnvSource): Omit<ProfileOptions, "isGlobal" | "store"> => {
    const avatarMaxBytes = countOf(env.optional("PROFILE_AVATAR_MAX_BYTES"))
    const avatarContentTypes = typesOf(env.optional("PROFILE_AVATAR_TYPES"))
    const nameMax = countOf(env.optional("PROFILE_NAME_MAX"))
    const uploadTtlSeconds = countOf(env.optional("PROFILE_AVATAR_UPLOAD_TTL_SECONDS"))
    return {
        ...(avatarMaxBytes === undefined ? {} : { avatarMaxBytes }),
        ...(avatarContentTypes === undefined ? {} : { avatarContentTypes }),
        ...(nameMax === undefined ? {} : { nameMax }),
        ...(uploadTtlSeconds === undefined ? {} : { uploadTtlSeconds }),
    }
}
