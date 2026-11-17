import { failureCodeOf } from "@/hooks/experience"
import type { ProfileIssue } from "@/hooks/profileWords"

/** The limits an avatar and a name are held to, as the profile read answers them. */
export type AvatarLimits = {
    readonly maxBytes: number
    readonly contentTypes: ReadonlyArray<string>
    readonly nameMax: number
}

/** The stable codes of the back end that name an issue. */
const ISSUE_OF_CODE: Readonly<Record<string, ProfileIssue>> = {
    PROFILE_AVATAR_TYPE_NOT_ALLOWED: "type",
    PROFILE_AVATAR_TOO_LARGE: "size",
    PROFILE_AVATAR_NOT_UPLOADED: "failed",
    PROFILE_AVATAR_KEY_INVALID: "failed",
    PROFILE_AVATAR_UNAVAILABLE: "unavailable",
    PROFILE_NAME_INVALID: "name",
}

/** The issue a failure stands for; a code the profile does not know is `other`. */
export const profileIssueOf = (error: unknown): ProfileIssue => ISSUE_OF_CODE[failureCodeOf(error)] ?? "other"

/** The content type of a picked file without parameters, in lower case. */
export const typeOfFile = (file: File): string => (file.type.split(";")[0] ?? "").trim().toLowerCase()

/** Checks a picked file against the limits before anything is asked of the server; the server checks again. */
export const avatarIssueOf = (file: File, limits: AvatarLimits): ProfileIssue => {
    if (!limits.contentTypes.includes(typeOfFile(file))) return "type"
    return file.size <= 0 || file.size > limits.maxBytes ? "size" : "none"
}
