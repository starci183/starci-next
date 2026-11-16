import type { EnvSource } from "@modules/platform/config"
import type { ProfileOptions } from "./profile.options"

/**
 * Reads the profile settings an environment declares, each optional with a default in `profileSettingsOf`:
 * `PROFILE_AVATAR_MAX_BYTES`, `PROFILE_AVATAR_TYPES` (comma separated), `PROFILE_NAME_MAX` and `PROFILE_AVATAR_UPLOAD_TTL_SECONDS`.
 */
export const parseProfileConfig = (env: EnvSource): Omit<ProfileOptions, "isGlobal" | "store"> => ({
    ...(env.has("PROFILE_AVATAR_MAX_BYTES") ? { avatarMaxBytes: env.int("PROFILE_AVATAR_MAX_BYTES", 0) } : {}),
    ...(env.has("PROFILE_AVATAR_TYPES")
        ? {
              avatarContentTypes: env
                  .string("PROFILE_AVATAR_TYPES")
                  .split(",")
                  .map((type) => type.trim().toLowerCase())
                  .filter((type) => type !== ""),
          }
        : {}),
    ...(env.has("PROFILE_NAME_MAX") ? { nameMax: env.int("PROFILE_NAME_MAX", 0) } : {}),
    ...(env.has("PROFILE_AVATAR_UPLOAD_TTL_SECONDS")
        ? { uploadTtlSeconds: env.int("PROFILE_AVATAR_UPLOAD_TTL_SECONDS", 0) }
        : {}),
})
