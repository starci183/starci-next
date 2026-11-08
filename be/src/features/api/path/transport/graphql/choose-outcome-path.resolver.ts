import { Args, Mutation, Resolver } from "@nestjs/graphql"
import type { CommandBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectCommandBus } from "@modules/platform/cqrs"
import { ChooseOutcomePathCommand } from "../../application/choose-outcome-path.command"
import { ChooseOutcomePathInput } from "./dto/choose-outcome-path.input"
import { ChosenOutcomePathType } from "./dto/chosen-outcome-path.type"
import { toChooseOutcomePathParams } from "./outcome-paths.mapper"

@Resolver()
/** GraphQL door that sets the outcome path the learner follows; it needs a session and no Premium. */
export class ChooseOutcomePathResolver {
    constructor(@InjectCommandBus() private readonly commandBus: CommandBus) {}

    /** Follows a path; an id outside the catalog is PATH_NOT_FOUND. Choosing the same path again keeps the first time. */
    @Mutation(() => ChosenOutcomePathType, { name: "chooseOutcomePath" })
    async chooseOutcomePath(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: ChooseOutcomePathInput,
    ): Promise<ChosenOutcomePathType> {
        return this.commandBus.execute(new ChooseOutcomePathCommand(toChooseOutcomePathParams(identity, input)))
    }
}
