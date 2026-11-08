import { Args, Mutation, Resolver } from "@nestjs/graphql"
import type { CommandBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectCommandBus } from "@modules/platform/cqrs"
import { SubmitExperienceCommand } from "../../application/submit-experience.command"
import { SubmitExperienceInput } from "./dto/submit-experience.input"
import { ExperienceItemType } from "./dto/experience-item.type"
import { toSubmitExperienceParams, toSubmitExperienceType } from "./submit-experience.mapper"

@Resolver()
/** GraphQL door of Send for review; it needs a session and Premium. */
export class SubmitExperienceResolver {
    constructor(@InjectCommandBus() private readonly commandBus: CommandBus) {}

    /** Submits the item with its line and answers it pending, with its deadline. */
    @Mutation(() => ExperienceItemType, { name: "submitExperience" })
    async submitExperience(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: SubmitExperienceInput,
    ): Promise<ExperienceItemType> {
        const result = await this.commandBus.execute(
            new SubmitExperienceCommand(toSubmitExperienceParams(identity, input)),
        )
        return toSubmitExperienceType(result)
    }
}
