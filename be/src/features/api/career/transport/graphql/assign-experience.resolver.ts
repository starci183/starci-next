import { Args, Mutation, Resolver } from "@nestjs/graphql"
import type { CommandBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectCommandBus } from "@modules/platform/cqrs"
import { AssignExperienceCommand } from "../../application/assign-experience.command"
import { AssignExperienceInput } from "./dto/assign-experience.input"
import { ExperienceItemType } from "./dto/experience-item.type"
import { toAssignExperienceParams, toAssignExperienceType } from "./assign-experience.mapper"

@Resolver()
/** GraphQL door of the teacher's reassignment of a pending item; it needs a session with role TEACHER. */
export class AssignExperienceResolver {
    constructor(@InjectCommandBus() private readonly commandBus: CommandBus) {}

    /** Assigns the item to a reviewer or to the teacher's queue and answers it. */
    @Mutation(() => ExperienceItemType, { name: "assignExperience" })
    async assignExperience(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: AssignExperienceInput,
    ): Promise<ExperienceItemType> {
        const result = await this.commandBus.execute(
            new AssignExperienceCommand(toAssignExperienceParams(identity, input)),
        )
        return toAssignExperienceType(result)
    }
}
