import { Args, Mutation, Resolver } from "@nestjs/graphql"
import type { CommandBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectCommandBus } from "@modules/platform/cqrs"
import { SetProfileNameCommand } from "../../application/set-profile-name.command"
import { ProfileType } from "./dto/profile.type"
import { SetProfileNameInput } from "./dto/set-profile-name.input"
import { toProfileType, toSetProfileNameParams } from "./profile.mapper"

@Resolver()
/** GraphQL door that sets the display name of the learner; it needs a session. */
export class SetProfileNameResolver {
    constructor(@InjectCommandBus() private readonly commandBus: CommandBus) {}

    /** Stores the name, or clears it; a name that is empty after trimming clears, one that is too long is PROFILE_NAME_INVALID. */
    @Mutation(() => ProfileType, { name: "setProfileName" })
    async setProfileName(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: SetProfileNameInput,
    ): Promise<ProfileType> {
        return toProfileType(
            await this.commandBus.execute(new SetProfileNameCommand(toSetProfileNameParams(identity, input))),
        )
    }
}
