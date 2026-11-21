/**
 * The profile capability: what a learner shows about themselves.
 *
 * - `ProfileService.read(learnerId, locale)`: the display name, a short-lived address of the avatar, the goal path and the limits
 *   an avatar is held to.
 * - `setDisplayName`: a name of 1 to `PROFILE_NAME_MAX` characters, or an empty one to clear it (PROFILE_NAME_INVALID).
 * - `requestAvatarUpload` then `confirmAvatar`: the browser uploads straight to the object store with a signed address that fixes the
 *   content type and exact size (`PROFILE_AVATAR_MAX_BYTES`, `PROFILE_AVATAR_TYPES`); confirming checks the key is the learner's
 *   own and the store holds what was asked, stores the key `avatars/<learner>/<id>.<ext>` and deletes the previous object.
 * - `removeAvatar`: clears the key and deletes the object.
 * - `ProfileCvService`: the CV link (`link` makes a slug once from the display or account name; `setVisibility` makes the CV public)
 *   and `publicCv(slug, locale)`, the verified lines the learner shows publicly (PROFILE_CV_NOT_FOUND for a private or unknown CV).
 *
 * The object store is a port (`AvatarStorePort`) the app binds; without one an upload is PROFILE_AVATAR_UNAVAILABLE and the profile
 * shows no avatar. The goal path is read from the path capability, never copied.
 */
export { PROFILE_ERROR_KINDS } from "./errors/profile.error"
export { PROFILE_MESSAGES } from "./messages/profile.messages"
export { parseProfileConfig } from "./profile.config"
export { profileEntities } from "./persistence/entities"
export type { AvatarUploadView, CvLinkView, ProfileLocale, ProfileView, PublicCvView } from "./profile.contracts"
export { ProfileModule } from "./profile.module"
export { ProfileCvService } from "./profile-cv.service"
export { ProfileService } from "./profile.service"
export { ObjectStorageAvatarClient } from "./object-storage-avatar.client"
