import { Args, Mutation, Resolver } from "@nestjs/graphql"
import type { CommandBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectCommandBus } from "@modules/platform/cqrs"
import { SubmitInterviewCommand } from "../../application/submit-interview.command"
import { InterviewSessionRefInput } from "./dto/interview-session-ref.input"
import { InterviewGradingType } from "./dto/interview-grading.type"
import { toSubmitInterviewParams, toInterviewGradingType } from "./submit-interview.mapper"

@Resolver()
/** GraphQL door `submitInterview`: Ends the interview and grades the whole session once; it answers when the grading is done or has failed. It needs a session. */
export class SubmitInterviewResolver {
    constructor(@InjectCommandBus() private readonly commandBus: CommandBus) {}

    /** Ends the interview and grades the whole session once; it answers when the grading is done or has failed. */
    @Mutation(() => InterviewGradingType, { name: "submitInterview" })
    async submitInterview(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: InterviewSessionRefInput,
    ): Promise<InterviewGradingType> {
        const result = await this.commandBus.execute(
            new SubmitInterviewCommand(toSubmitInterviewParams(identity, input)),
        )
        return toInterviewGradingType(result)
    }
}
