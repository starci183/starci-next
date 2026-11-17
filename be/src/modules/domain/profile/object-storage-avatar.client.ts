import { Injectable } from "@nestjs/common"
import {
    InjectObjectStorage,
    InjectObjectStorageBucket,
    type ObjectStorage,
} from "@modules/integrations/object-storage"
import type { AvatarStorePort } from "./profile-store.port"
import type { AvatarReadUrl, AvatarUploadRequest, OptionalStoredAvatar, SignedAvatarUpload } from "./profile.contracts"

@Injectable()
/**
 * The avatar store bound to the S3-compatible object store of the app (MinIO in dev): the bucket is the app's one bucket, the key
 * layout is the profile's own. A signed upload fixes the content type and the exact size, so the store itself refuses another file.
 */
export class ObjectStorageAvatarClient implements AvatarStorePort {
    constructor(
        @InjectObjectStorage() private readonly storage: ObjectStorage,
        @InjectObjectStorageBucket() private readonly bucket: string,
    ) {}

    /** A signed PUT of the key that fixes the content type and the exact size. */
    async presignUpload(key: string, request: AvatarUploadRequest): Promise<SignedAvatarUpload> {
        const signed = await this.storage.presignPut(this.bucket, key, {
            contentType: request.contentType,
            contentLength: request.contentLength,
            expiresIn: request.expiresIn,
        })
        return { url: signed.url, headers: signed.headers, expiresAt: signed.expiresAt }
    }

    /** A signed GET of the key. */
    async presignRead(key: string): Promise<AvatarReadUrl> {
        return (await this.storage.presignGet(this.bucket, key)).url
    }

    /** What the store recorded about the key, or null when it is not there. */
    async head(key: string): Promise<OptionalStoredAvatar> {
        const head = await this.storage.head(this.bucket, key)
        return head === null ? null : { size: head.size, contentType: head.contentType }
    }

    /** Deletes the key; a missing key is not an error. */
    remove(key: string): Promise<void> {
        return this.storage.remove(this.bucket, key)
    }
}
