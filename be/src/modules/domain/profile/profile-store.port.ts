import { injector, type TypedParameterDecorator } from "@modules/platform/composition"
import type { AvatarReadUrl, AvatarUploadRequest, OptionalStoredAvatar, SignedAvatarUpload } from "./profile.contracts"

/** The port through which the profile reaches the object store; the app binds the S3-compatible store (MinIO in dev). */
export interface AvatarStorePort {
    /** A signed upload of `key`; the content type and the exact size are part of the signature. */
    presignUpload(key: string, request: AvatarUploadRequest): Promise<SignedAvatarUpload>
    /** A signed address that reads `key`, or null when it cannot be signed. */
    presignRead(key: string): Promise<AvatarReadUrl>
    /** What the store holds at `key`, or null when it is not there. */
    head(key: string): Promise<OptionalStoredAvatar>
    /** Deletes `key`; a missing key is not an error. */
    remove(key: string): Promise<void>
}

/** Token of the avatar store port. */
export const PROFILE_AVATAR_STORE: unique symbol = Symbol("domain.profile.avatar-store")

/** Injects the avatar store port. Parameter type: AvatarStorePort. */
export const InjectAvatarStore = (): TypedParameterDecorator<AvatarStorePort> =>
    injector<AvatarStorePort>(PROFILE_AVATAR_STORE)
