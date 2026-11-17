import { Module } from "@nestjs/common"
import { ProfileApiModule } from "../../profile.module"
import { ConfirmAvatarUploadResolver } from "./confirm-avatar-upload.resolver"
import { GetMyProfileResolver } from "./get-my-profile.resolver"
import { ConfigurableModuleClass } from "./profile-graphql.module-definition"
import { RemoveAvatarResolver } from "./remove-avatar.resolver"
import { RequestAvatarUploadResolver } from "./request-avatar-upload.resolver"
import { SetProfileNameResolver } from "./set-profile-name.resolver"
import { GetMyCvLinkResolver } from "./get-my-cv-link.resolver"
import { SetCvVisibilityResolver } from "./set-cv-visibility.resolver"
import { GetPublicCvResolver } from "./get-public-cv.resolver"

@Module({
    imports: [ProfileApiModule.register({})],
    providers: [
        GetMyProfileResolver,
        SetProfileNameResolver,
        RequestAvatarUploadResolver,
        ConfirmAvatarUploadResolver,
        RemoveAvatarResolver,
        GetMyCvLinkResolver,
        SetCvVisibilityResolver,
        GetPublicCvResolver,
    ],
})
/** The GraphQL transport of the profile feature. */
export class ProfileGraphqlModule extends ConfigurableModuleClass {}
