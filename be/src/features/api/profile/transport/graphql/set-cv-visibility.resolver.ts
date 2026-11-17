import { Args, Mutation, Resolver } from "@nestjs/graphql"
import type { CommandBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectCommandBus } from "@modules/platform/cqrs"
import { SetCvVisibilityCommand } from "../../application/set-cv-visibility.command"
import { SetCvVisibilityInput } from "./dto/set-cv-visibility.input"
import { CvLinkType } from "./dto/cv-link.type"
import { toSetCvVisibilityParams } from "./set-cv-visibility.mapper"

@Resolver()
/** GraphQL door of the CV visibility; it needs a session and no Premium. */
export class SetCvVisibilityResolver {
    constructor(@InjectCommandBus() private readonly commandBus: CommandBus) {}

    /** Makes the CV of the learner public or private and answers the link. */
    @Mutation(() => CvLinkType, { name: "setCvVisibility" })
    setCvVisibility(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: SetCvVisibilityInput,
    ): Promise<CvLinkType> {
        return this.commandBus.execute(new SetCvVisibilityCommand(toSetCvVisibilityParams(identity, input)))
    }
}
