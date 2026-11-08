import { Args, Mutation, Resolver } from "@nestjs/graphql"
import type { CommandBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectCommandBus } from "@modules/platform/cqrs"
import { SubmitLessonAttemptCommand } from "../../application/submit-lesson-attempt.command"
import { LessonAttemptType } from "./dto/lesson-attempt.type"
import { SubmitLessonAttemptInput } from "./dto/submit-lesson-attempt.input"
import { toLessonAttemptType } from "./get-lesson-attempt.mapper"
import { toSubmitLessonAttemptParams } from "./submit-lesson-attempt.mapper"

@Resolver()
/** GraphQL door that stores the answer of a learner to a lesson activity and grades it; it needs a session, and Premium beyond the free phase. */
export class SubmitLessonAttemptResolver {
    constructor(@InjectCommandBus() private readonly commandBus: CommandBus) {}

    /** Stores the answer once per revision and answers the attempt; a choice and a simulation come back graded. */
    @Mutation(() => LessonAttemptType, { name: "submitLessonAttempt" })
    async submitLessonAttempt(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: SubmitLessonAttemptInput,
    ): Promise<LessonAttemptType> {
        const result = await this.commandBus.execute(
            new SubmitLessonAttemptCommand(toSubmitLessonAttemptParams(identity, input)),
        )
        return toLessonAttemptType(result)
    }
}
