import { Args, Mutation, Resolver } from "@nestjs/graphql"
import type { CommandBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectCommandBus } from "@modules/platform/cqrs"
import { RevealPracticeHintCommand } from "../../application/reveal-practice-hint.command"
import { RevealPracticeHintInput } from "./dto/reveal-practice-hint.input"
import { PracticeHintType } from "./dto/practice-hint.type"
import { toRevealPracticeHintParams } from "./reveal-practice-hint.mapper"
import { toPracticeHintType } from "./practice-view.mapper"

@Resolver()
/** GraphQL door of opening a hint step; it needs a session, and Premium beyond the free problems of a pattern. */
export class RevealPracticeHintResolver {
    constructor(@InjectCommandBus() private readonly commandBus: CommandBus) {}

    /** Opens one step of the hint ladder, in order. */
    @Mutation(() => PracticeHintType, { name: "revealPracticeHint" })
    async revealPracticeHint(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: RevealPracticeHintInput,
    ): Promise<PracticeHintType> {
        const result = await this.commandBus.execute(
            new RevealPracticeHintCommand(toRevealPracticeHintParams(identity, input)),
        )
        return toPracticeHintType(result)
    }
}
