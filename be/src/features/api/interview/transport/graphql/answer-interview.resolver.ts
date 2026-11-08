import { Args, Mutation, Resolver } from "@nestjs/graphql"
import type { CommandBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectCommandBus } from "@modules/platform/cqrs"
import { AnswerInterviewCommand } from "../../application/answer-interview.command"
import { AnswerInterviewInput } from "./dto/answer-interview.input"
import { InterviewAnswerType } from "./dto/interview-answer.type"
import { toAnswerInterviewParams, toInterviewAnswerType } from "./answer-interview.mapper"

@Resolver()
/** GraphQL door `answerInterview`: Stores the answer to the open question, then asks the interviewer what follows; it shows no score and no feedback. It needs a session. */
export class AnswerInterviewResolver {
    constructor(@InjectCommandBus() private readonly commandBus: CommandBus) {}

    /** Stores the answer to the open question, then asks the interviewer what follows; it shows no score and no feedback. */
    @Mutation(() => InterviewAnswerType, { name: "answerInterview" })
    async answerInterview(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: AnswerInterviewInput,
    ): Promise<InterviewAnswerType> {
        const result = await this.commandBus.execute(
            new AnswerInterviewCommand(toAnswerInterviewParams(identity, input)),
        )
        return toInterviewAnswerType(result)
    }
}
