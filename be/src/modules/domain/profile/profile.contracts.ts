/** The locales the profile speaks. */
export type ProfileLocale = "vi" | "en"

/** The limits the profile holds an avatar and a display name to; the browser reads them to check before it sends. */
export interface AvatarLimitsView {
    /** The largest avatar in bytes. */
    readonly maxBytes: number
    /** The content types admitted. */
    readonly contentTypes: Array<string>
    /** The longest display name in characters. */
    readonly nameMax: number
}

/** The outcome path the learner follows, as the profile shows it. */
export interface ProfileGoalView {
    /** The path id. */
    readonly pathId: string
    /** The path title in the asked locale. */
    readonly title: string
}

/** The profile of a learner. */
export interface ProfileView {
    /** The name the learner chose, or null while the name of their account shows. */
    readonly displayName: string | null
    /** A short-lived address of the avatar, or null while there is none or the store cannot answer. */
    readonly avatarUrl: string | null
    /** When the avatar was set, or null. */
    readonly avatarUpdatedAt: string | null
    /** The goal path, or null when none is chosen. */
    readonly goal: ProfileGoalView | null
    /** The limits an avatar upload is held to. */
    readonly limits: AvatarLimitsView
}

/** What a learner is given to upload an avatar straight to the store. */
export interface AvatarUploadView {
    /** The storage key the upload goes to; sent back to confirm it. */
    readonly key: string
    /** The HTTP method of the upload. */
    readonly method: "PUT"
    /** The signed address to send the bytes to. */
    readonly url: string
    /** The headers the upload must carry unchanged. */
    readonly headers: Array<{ readonly name: string; readonly value: string }>
    /** When the signed address stops working, ISO 8601. */
    readonly expiresAt: string
    /** The limits the upload is held to. */
    readonly limits: AvatarLimitsView
}

/** What the avatar request is given. */
export interface AvatarUploadParams {
    /** The learner. */
    readonly learnerId: string
    /** The content type of the image. */
    readonly contentType: string
    /** The exact size of the image in bytes. */
    readonly size: number
}

/** What the avatar confirmation is given. */
export interface AvatarConfirmParams {
    /** The learner. */
    readonly learnerId: string
    /** The key the request answered. */
    readonly key: string
    /** The content type that was asked for. */
    readonly contentType: string
    /** The size that was asked for. */
    readonly size: number
    /** The locale of the answer. */
    readonly locale: ProfileLocale
}

/** What the store holds about one object. */
export interface StoredAvatar {
    /** The size in bytes. */
    readonly size: number
    /** The content type the store recorded. */
    readonly contentType: string
}

/** The display name to store; null or empty clears it. */
export type OptionalDisplayName = string | null

/** A signed address that reads an avatar, or null when it cannot be signed. */
export type AvatarReadUrl = string | null

/** What the store holds at a key, or null when nothing is there. */
export type OptionalStoredAvatar = StoredAvatar | null

/** What the store is asked to sign for one avatar upload. */
export interface AvatarUploadRequest {
    /** The content type the upload must carry. */
    readonly contentType: string
    /** The exact size in bytes. */
    readonly contentLength: number
    /** How long the signed address works, in seconds. */
    readonly expiresIn: number
}

/** A signed upload as the store gives it. */
export interface SignedAvatarUpload {
    /** The signed address. */
    readonly url: string
    /** The headers to send unchanged. */
    readonly headers: Readonly<Record<string, string>>
    /** When it stops working, ISO 8601. */
    readonly expiresAt: string
}

/** The CV link of a learner: where the public CV lives and whether anyone can open it. */
export interface CvLinkView {
    /** The slug of the link, fixed once it is made. */
    readonly slug: string
    /** The path of the public CV on the web app, `/cv/<slug>`. */
    readonly path: string
    /** Whether anyone with the link can open the CV; false until the learner makes it public. */
    readonly isPublic: boolean
    /** How many verified lines the learner has. */
    readonly verifiedCount: number
}

/** What the CV link read or change is given. */
export interface CvLinkParams {
    /** The learner. */
    readonly learnerId: string
    /** The name of the learner's account, used for the slug when no display name is chosen, or null. */
    readonly accountName: string | null
}

/** What the visibility change is given. */
export interface CvVisibilityParams extends CvLinkParams {
    /** Whether the CV is public. */
    readonly isPublic: boolean
}

/** What a public CV read is given. */
export interface PublicCvParams {
    /** The slug of the link. */
    readonly slug: string
    /** The locale of the lines. */
    readonly locale: ProfileLocale
}

/** One verified line a public CV shows. */
export interface PublicCvLine {
    /** The signed line in the asked locale. */
    readonly line: string
    /** The part that granted it: essentials, projects, incidents, practice or harness. */
    readonly source: string
    /** The public verification code of /verify/{code}. */
    readonly verificationCode: string
    /** When it was signed, ISO 8601. */
    readonly signedAt: string
}

/** The public CV of a learner: who they are and the verified lines they show, nothing else. */
export interface PublicCvView {
    /** The display name, else the name of the account. */
    readonly displayName: string
    /** A short-lived address of the avatar, or null. */
    readonly avatarUrl: string | null
    /** The verified lines the learner shows, newest signature first. */
    readonly lines: Array<PublicCvLine>
}
