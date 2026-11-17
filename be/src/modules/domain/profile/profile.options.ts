import type { Type } from "@nestjs/common"
import type { AvatarStorePort } from "./profile-store.port"

/** Options of the profile capability. */
export interface ProfileOptions {
    /** Whether this capability is available app-wide. */
    readonly isGlobal?: boolean
    /** The largest avatar in bytes; `PROFILE_AVATAR_MAX_BYTES`, 2 MiB by default. */
    readonly avatarMaxBytes?: number
    /** The content types an avatar may have; `PROFILE_AVATAR_TYPES`, PNG, JPEG and WebP by default. */
    readonly avatarContentTypes?: ReadonlyArray<string>
    /** The longest display name in characters; `PROFILE_NAME_MAX`, 60 by default. */
    readonly nameMax?: number
    /** How long a signed upload works, in seconds; `PROFILE_AVATAR_UPLOAD_TTL_SECONDS`, 300 by default. */
    readonly uploadTtlSeconds?: number
    /** The object store of avatars; absent, none is configured and an upload is refused as unavailable. */
    readonly store?: Type<AvatarStorePort>
}
