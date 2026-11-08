import { Args, Mutation, Resolver } from "@nestjs/graphql"
import type { CommandBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectCommandBus } from "@modules/platform/cqrs"
import { SetExperienceReviewerCommand } from "../../application/set-experience-reviewer.command"
import { SetExperienceReviewerInput } from "./dto/set-experience-reviewer.input"
import { ReviewerType } from "./dto/reviewer.type"
import { toSetExperienceReviewerParams, toSetExperienceReviewerType } from "./set-experience-reviewer.mapper"

@Resolver()
/** GraphQL door of the teacher's reviewer appointments; it needs a session with role TEACHER. */
export class SetExperienceReviewerResolver {
    constructor(@InjectCommandBus() private readonly commandBus: CommandBus) {}

    /** Appoints the reviewer with a scope, or ends the appointment, and answers it. */
    @Mutation(() => ReviewerType, { name: "setExperienceReviewer" })
    async setExperienceReviewer(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: SetExperienceReviewerInput,
    ): Promise<ReviewerType> {
        const result = await this.commandBus.execute(
            new SetExperienceReviewerCommand(toSetExperienceReviewerParams(identity, input)),
        )
        return toSetExperienceReviewerType(result)
    }
}
