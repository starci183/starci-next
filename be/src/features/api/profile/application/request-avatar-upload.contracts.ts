/** The request of the requestAvatarUpload door. */
export interface RequestAvatarUploadRequest {
    /** The content type of the image. */
    readonly contentType: string
    /** The exact size of the image in bytes. */
    readonly size: number
}
