import { Args, Mutation, Resolver } from "@nestjs/graphql"
import type { CommandBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectCommandBus } from "@modules/platform/cqrs"
import { RequestAvatarUploadCommand } from "../../application/request-avatar-upload.command"
import { AvatarUploadType } from "./dto/avatar-upload.type"
import { RequestAvatarUploadInput } from "./dto/request-avatar-upload.input"
import { toAvatarUploadType, toRequestAvatarUploadParams } from "./profile.mapper"

@Resolver()
/** GraphQL door that signs an avatar upload; the type and size are held to the profile limits before anything is signed. */
export class RequestAvatarUploadResolver {
    constructor(@InjectCommandBus() private readonly commandBus: CommandBus) {}

    /** Answers the signed address and headers the browser sends the bytes with; PROFILE_AVATAR_TYPE_NOT_ALLOWED or PROFILE_AVATAR_TOO_LARGE otherwise. */
    @Mutation(() => AvatarUploadType, { name: "requestAvatarUpload" })
    async requestAvatarUpload(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: RequestAvatarUploadInput,
    ): Promise<AvatarUploadType> {
        return toAvatarUploadType(
            await this.commandBus.execute(new RequestAvatarUploadCommand(toRequestAvatarUploadParams(identity, input))),
        )
    }
}
