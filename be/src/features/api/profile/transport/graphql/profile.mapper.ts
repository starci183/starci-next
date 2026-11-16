import type { IdentityPrincipal } from "@modules/domain/identity"
import type { AvatarUploadView, ProfileView } from "@modules/domain/profile"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { ConfirmAvatarUploadRequest } from "../../application/confirm-avatar-upload.contracts"
import type { GetMyProfileRequest } from "../../application/get-my-profile.contracts"
import type { RequestAvatarUploadRequest } from "../../application/request-avatar-upload.contracts"
import type { SetProfileNameRequest } from "../../application/set-profile-name.contracts"
import type { AvatarUploadType } from "./dto/avatar-upload.type"
import type { ConfirmAvatarUploadInput } from "./dto/confirm-avatar-upload.input"
import type { ProfileInput } from "./dto/profile.input"
import type { ProfileType } from "./dto/profile.type"
import type { RequestAvatarUploadInput } from "./dto/request-avatar-upload.input"
import type { SetProfileNameInput } from "./dto/set-profile-name.input"

/** Maps the profile input and the session to the message params. */
export const toProfileParams = (
    identity: IdentityPrincipal,
    input: ProfileInput,
): ExecuteParams<GetMyProfileRequest> => ({
    request: { locale: input.locale },
    principal: { id: identity.subject, role: "authenticated" },
})

/** Maps the name input and the session to the message params. */
export const toSetProfileNameParams = (
    identity: IdentityPrincipal,
    input: SetProfileNameInput,
): ExecuteParams<SetProfileNameRequest> => ({
    request: { displayName: input.displayName, locale: input.locale },
    principal: { id: identity.subject, role: "authenticated" },
})

/** Maps the avatar upload input and the session to the message params. */
export const toRequestAvatarUploadParams = (
    identity: IdentityPrincipal,
    input: RequestAvatarUploadInput,
): ExecuteParams<RequestAvatarUploadRequest> => ({
    request: { contentType: input.contentType, size: input.size },
    principal: { id: identity.subject, role: "authenticated" },
})

/** Maps the avatar confirmation input and the session to the message params. */
export const toConfirmAvatarUploadParams = (
    identity: IdentityPrincipal,
    input: ConfirmAvatarUploadInput,
): ExecuteParams<ConfirmAvatarUploadRequest> => ({
    request: { key: input.key, contentType: input.contentType, size: input.size, locale: input.locale },
    principal: { id: identity.subject, role: "authenticated" },
})

/** Maps the profile to its GraphQL type; the view is already the shape the type declares. */
export const toProfileType = (view: ProfileView): ProfileType => view

/** Maps the signed upload to its GraphQL type; the view is already the shape the type declares. */
export const toAvatarUploadType = (view: AvatarUploadView): AvatarUploadType => view
