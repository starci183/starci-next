import { Args, Mutation, Resolver } from "@nestjs/graphql"
import type { CommandBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectCommandBus } from "@modules/platform/cqrs"
import { RevealPracticeSolutionCommand } from "../../application/reveal-practice-solution.command"
import { RevealPracticeSolutionInput } from "./dto/reveal-practice-solution.input"
import { PracticeSolutionType } from "./dto/practice-solution.type"
import { toRevealPracticeSolutionParams } from "./reveal-practice-solution.mapper"
import { toPracticeSolutionType } from "./practice-view.mapper"

@Resolver()
/** GraphQL door of revealing a reference solution; it needs a session and no Premium. */
export class RevealPracticeSolutionResolver {
    constructor(@InjectCommandBus() private readonly commandBus: CommandBus) {}

    /** Asks the reference solution of one problem to be revealed. */
    @Mutation(() => PracticeSolutionType, { name: "revealPracticeSolution" })
    async revealPracticeSolution(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: RevealPracticeSolutionInput,
    ): Promise<PracticeSolutionType> {
        const result = await this.commandBus.execute(
            new RevealPracticeSolutionCommand(toRevealPracticeSolutionParams(identity, input)),
        )
        return toPracticeSolutionType(result)
    }
}
