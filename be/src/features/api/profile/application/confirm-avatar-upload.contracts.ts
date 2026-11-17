import type { ProfileLocale } from "@modules/domain/profile"

/** The request of the confirmAvatarUpload door. */
export interface ConfirmAvatarUploadRequest {
    /** The storage key the upload request answered. */
    readonly key: string
    /** The content type that was asked for. */
    readonly contentType: string
    /** The size that was asked for. */
    readonly size: number
    /** The locale of the answer. */
    readonly locale: ProfileLocale
}
