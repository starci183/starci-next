import { Module } from "@nestjs/common"
import { ProfileApiModule } from "../../profile.module"
import { ConfirmAvatarUploadResolver } from "./confirm-avatar-upload.resolver"
import { GetMyProfileResolver } from "./get-my-profile.resolver"
import { ConfigurableModuleClass } from "./profile-graphql.module-definition"
import { RemoveAvatarResolver } from "./remove-avatar.resolver"
import { RequestAvatarUploadResolver } from "./request-avatar-upload.resolver"
import { SetProfileNameResolver } from "./set-profile-name.resolver"

@Module({
    imports: [ProfileApiModule.register({})],
    providers: [
        GetMyProfileResolver,
        SetProfileNameResolver,
        RequestAvatarUploadResolver,
        ConfirmAvatarUploadResolver,
        RemoveAvatarResolver,
    ],
})
/** The GraphQL transport of the profile feature. */
export class ProfileGraphqlModule extends ConfigurableModuleClass {}
