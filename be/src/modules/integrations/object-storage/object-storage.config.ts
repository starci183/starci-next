import type { EnvSource } from "@modules/platform/config"
import type { ObjectStorageOptions } from "./object-storage.options"

const PRESIGN_TTL_SECONDS = 300

/** `STORAGE_PUBLIC_URL` (optional): the origin browsers reach the store at, as an origin (no path, no trailing slash). */
const publicUrlOf = (env: EnvSource): string | undefined => {
    const text = env.optional("STORAGE_PUBLIC_URL")?.trim()
    return text === undefined || text === "" ? undefined : new URL(text).origin
}

/** Reads the object storage configuration with no credential or endpoint defaults; secrets read `<KEY>_FILE` first. */
export const parseObjectStorageConfig = (env: EnvSource): ObjectStorageOptions => ({
    ...(env.has("STORAGE_PUBLIC_URL") ? { publicEndpoint: env.url("STORAGE_PUBLIC_URL").replace(/\/$/u, "") } : {}),
    endpoint: env.url("STORAGE_ENDPOINT"),
    region: env.string("STORAGE_REGION"),
    bucket: env.string("STORAGE_BUCKET"),
    accessKeyId: env.secret("STORAGE_ACCESS_KEY_ID"),
    secretAccessKey: env.secret("STORAGE_SECRET_ACCESS_KEY"),
    defaultExpiresIn: env.int("STORAGE_PRESIGN_TTL_SECONDS", PRESIGN_TTL_SECONDS),
    // the origin browsers reach the store at (the dev tunnel host): a signed address is signed for it; absent, it is the internal endpoint
    ...(publicUrlOf(env) === undefined ? {} : { publicEndpoint: publicUrlOf(env) as string }),
})
