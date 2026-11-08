import { Args, Mutation, Resolver } from "@nestjs/graphql"
import type { CommandBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectCommandBus } from "@modules/platform/cqrs"
import { ShowExperienceCommand } from "../../application/show-experience.command"
import { ShowExperienceInput } from "./dto/show-experience.input"
import { ExperienceItemType } from "./dto/experience-item.type"
import { toShowExperienceParams, toShowExperienceType } from "./show-experience.mapper"

@Resolver()
/** GraphQL door of Show on profile; it needs a session. */
export class ShowExperienceResolver {
    constructor(@InjectCommandBus() private readonly commandBus: CommandBus) {}

    /** Shows or hides the verified item and answers it. */
    @Mutation(() => ExperienceItemType, { name: "showExperience" })
    async showExperience(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: ShowExperienceInput,
    ): Promise<ExperienceItemType> {
        const result = await this.commandBus.execute(new ShowExperienceCommand(toShowExperienceParams(identity, input)))
        return toShowExperienceType(result)
    }
}
