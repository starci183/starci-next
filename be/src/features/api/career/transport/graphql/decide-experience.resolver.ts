import { Args, Mutation, Resolver } from "@nestjs/graphql"
import type { CommandBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectCommandBus } from "@modules/platform/cqrs"
import { DecideExperienceCommand } from "../../application/decide-experience.command"
import { DecideExperienceInput } from "./dto/decide-experience.input"
import { DecisionResultType } from "./dto/decision-result.type"
import { toDecideExperienceParams, toDecideExperienceType } from "./decide-experience.mapper"

@Resolver()
/** GraphQL door of Verify and Return with a note; it needs a session with role TEACHER or REVIEWER. */
export class DecideExperienceResolver {
    constructor(@InjectCommandBus() private readonly commandBus: CommandBus) {}

    /** Applies each decision on its own and answers its new state or the code that refused it. */
    @Mutation(() => [DecisionResultType], { name: "decideExperience" })
    async decideExperience(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: DecideExperienceInput,
    ): Promise<Array<DecisionResultType>> {
        const result = await this.commandBus.execute(
            new DecideExperienceCommand(toDecideExperienceParams(identity, input)),
        )
        return toDecideExperienceType(result)
    }
}
