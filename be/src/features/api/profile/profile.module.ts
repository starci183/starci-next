import { Module } from "@nestjs/common"
import { ConfirmAvatarUploadHandler } from "./application/confirm-avatar-upload.handler"
import { GetMyProfileHandler } from "./application/get-my-profile.handler"
import { RemoveAvatarHandler } from "./application/remove-avatar.handler"
import { RequestAvatarUploadHandler } from "./application/request-avatar-upload.handler"
import { SetProfileNameHandler } from "./application/set-profile-name.handler"
import { GetMyCvLinkHandler } from "./application/get-my-cv-link.handler"
import { SetCvVisibilityHandler } from "./application/set-cv-visibility.handler"
import { GetPublicCvHandler } from "./application/get-public-cv.handler"
import { ConfigurableModuleClass } from "./profile.module-definition"

@Module({
    providers: [
        GetMyProfileHandler,
        SetProfileNameHandler,
        RequestAvatarUploadHandler,
        ConfirmAvatarUploadHandler,
        RemoveAvatarHandler,
        GetMyCvLinkHandler,
        SetCvVisibilityHandler,
        GetPublicCvHandler,
    ],
})
/** Application handlers of the profile feature: read the profile, set the name, upload, confirm and remove the avatar, and the CV link with its public read. */
export class ProfileApiModule extends ConfigurableModuleClass {}
