import { Args, Mutation, Resolver } from "@nestjs/graphql"
import type { CommandBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectCommandBus } from "@modules/platform/cqrs"
import { RetryInterviewTurnCommand } from "../../application/retry-interview-turn.command"
import { InterviewSessionRefInput } from "./dto/interview-session-ref.input"
import { InterviewAnswerType } from "./dto/interview-answer.type"
import { toRetryInterviewTurnParams, toInterviewAnswerType } from "./retry-interview-turn.mapper"

@Resolver()
/** GraphQL door `retryInterviewTurn`: Asks the interviewer again for the turn a failure skipped; the learner never answers twice. It needs a session. */
export class RetryInterviewTurnResolver {
    constructor(@InjectCommandBus() private readonly commandBus: CommandBus) {}

    /** Asks the interviewer again for the turn a failure skipped; the learner never answers twice. */
    @Mutation(() => InterviewAnswerType, { name: "retryInterviewTurn" })
    async retryInterviewTurn(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: InterviewSessionRefInput,
    ): Promise<InterviewAnswerType> {
        const result = await this.commandBus.execute(
            new RetryInterviewTurnCommand(toRetryInterviewTurnParams(identity, input)),
        )
        return toInterviewAnswerType(result)
    }
}
