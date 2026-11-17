import { Args, Mutation, Resolver } from "@nestjs/graphql"
import type { CommandBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectCommandBus } from "@modules/platform/cqrs"
import { RemoveAvatarCommand } from "../../application/remove-avatar.command"
import { ProfileInput } from "./dto/profile.input"
import { ProfileType } from "./dto/profile.type"
import { toProfileParams, toProfileType } from "./profile.mapper"

@Resolver()
/** GraphQL door that removes the avatar of the learner. */
export class RemoveAvatarResolver {
    constructor(@InjectCommandBus() private readonly commandBus: CommandBus) {}

    /** Clears the avatar and deletes its object. */
    @Mutation(() => ProfileType, { name: "removeAvatar" })
    async removeAvatar(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: ProfileInput,
    ): Promise<ProfileType> {
        return toProfileType(await this.commandBus.execute(new RemoveAvatarCommand(toProfileParams(identity, input))))
    }
}
