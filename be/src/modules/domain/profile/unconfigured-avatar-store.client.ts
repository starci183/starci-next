import { Injectable } from "@nestjs/common"
import { ProfileError, ProfileErrorCode } from "./errors/profile.error"
import type { AvatarStorePort } from "./profile-store.port"
import type { AvatarReadUrl, OptionalStoredAvatar, SignedAvatarUpload } from "./profile.contracts"

@Injectable()
/** The avatar store of an app that binds none: nothing can be uploaded, and the profile shows no avatar. */
export class UnconfiguredAvatarStoreClient implements AvatarStorePort {
    /** Refuses: no store is configured. */
    presignUpload(): Promise<SignedAvatarUpload> {
        return Promise.reject(new ProfileError({ code: ProfileErrorCode.AvatarUnavailable }))
    }

    /** Answers with no address. */
    presignRead(): Promise<AvatarReadUrl> {
        return Promise.resolve(null)
    }

    /** Refuses: no store is configured. */
    head(): Promise<OptionalStoredAvatar> {
        return Promise.reject(new ProfileError({ code: ProfileErrorCode.AvatarUnavailable }))
    }

    /** Does nothing: there is nothing to delete. */
    remove(): Promise<void> {
        return Promise.resolve()
    }
}
