import { Args, Mutation, Resolver } from "@nestjs/graphql"
import type { CommandBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectCommandBus } from "@modules/platform/cqrs"
import { ConfirmAvatarUploadCommand } from "../../application/confirm-avatar-upload.command"
import { ConfirmAvatarUploadInput } from "./dto/confirm-avatar-upload.input"
import { ProfileType } from "./dto/profile.type"
import { toConfirmAvatarUploadParams, toProfileType } from "./profile.mapper"

@Resolver()
/** GraphQL door that keeps an uploaded avatar once the store holds it. */
export class ConfirmAvatarUploadResolver {
    constructor(@InjectCommandBus() private readonly commandBus: CommandBus) {}

    /** Stores the key as the learner avatar and deletes the previous one; PROFILE_AVATAR_NOT_UPLOADED when the store does not hold what was asked. */
    @Mutation(() => ProfileType, { name: "confirmAvatarUpload" })
    async confirmAvatarUpload(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: ConfirmAvatarUploadInput,
    ): Promise<ProfileType> {
        return toProfileType(
            await this.commandBus.execute(new ConfirmAvatarUploadCommand(toConfirmAvatarUploadParams(identity, input))),
        )
    }
}
