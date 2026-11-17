import { DomainError, type ErrorKind } from "@modules/platform/errors"

/** Codes of the profile capability (the learner name and avatar). */
export enum ProfileErrorCode {
    /** The display name is empty, too long or holds control characters. */
    NameInvalid = "PROFILE_NAME_INVALID",
    /** The avatar content type is not one the profile admits. */
    AvatarTypeNotAllowed = "PROFILE_AVATAR_TYPE_NOT_ALLOWED",
    /** The avatar is larger than the profile admits, or has no size. */
    AvatarTooLarge = "PROFILE_AVATAR_TOO_LARGE",
    /** The key does not belong to the learner who confirms it. */
    AvatarKeyInvalid = "PROFILE_AVATAR_KEY_INVALID",
    /** The learner confirms an avatar the store does not hold, or holds in another type or size than asked. */
    AvatarNotUploaded = "PROFILE_AVATAR_NOT_UPLOADED",
    /** No object store is configured for this environment. */
    AvatarUnavailable = "PROFILE_AVATAR_UNAVAILABLE",
}

/** How each profile code travels. */
export const PROFILE_ERROR_KINDS: Record<ProfileErrorCode, ErrorKind> = {
    [ProfileErrorCode.NameInvalid]: "invalid",
    [ProfileErrorCode.AvatarTypeNotAllowed]: "invalid",
    [ProfileErrorCode.AvatarTooLarge]: "invalid",
    [ProfileErrorCode.AvatarKeyInvalid]: "invalid",
    [ProfileErrorCode.AvatarNotUploaded]: "not-found",
    [ProfileErrorCode.AvatarUnavailable]: "unavailable",
}

/** The one error class of the profile capability. */
export class ProfileError extends DomainError<ProfileErrorCode> {}
