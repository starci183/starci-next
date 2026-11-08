import { Args, Mutation, Resolver } from "@nestjs/graphql"
import type { CommandBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectCommandBus } from "@modules/platform/cqrs"
import { RevokeExperienceCommand } from "../../application/revoke-experience.command"
import { RevokeExperienceInput } from "./dto/revoke-experience.input"
import { ExperienceItemType } from "./dto/experience-item.type"
import { toRevokeExperienceParams, toRevokeExperienceType } from "./revoke-experience.mapper"

@Resolver()
/** GraphQL door of Revoke; it needs a session with role TEACHER. */
export class RevokeExperienceResolver {
    constructor(@InjectCommandBus() private readonly commandBus: CommandBus) {}

    /** Revokes the item with its reason and answers it revoked. */
    @Mutation(() => ExperienceItemType, { name: "revokeExperience" })
    async revokeExperience(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: RevokeExperienceInput,
    ): Promise<ExperienceItemType> {
        const result = await this.commandBus.execute(
            new RevokeExperienceCommand(toRevokeExperienceParams(identity, input)),
        )
        return toRevokeExperienceType(result)
    }
}
