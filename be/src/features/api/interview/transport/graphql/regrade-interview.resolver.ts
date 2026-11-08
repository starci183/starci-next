import { Args, Mutation, Resolver } from "@nestjs/graphql"
import type { CommandBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectCommandBus } from "@modules/platform/cqrs"
import { RegradeInterviewCommand } from "../../application/regrade-interview.command"
import { InterviewSessionRefInput } from "./dto/interview-session-ref.input"
import { InterviewGradingType } from "./dto/interview-grading.type"
import { toRegradeInterviewParams, toInterviewGradingType } from "./regrade-interview.mapper"

@Resolver()
/** GraphQL door `regradeInterview`: Grades a session again after a failed grading; the transcript is kept and the learner is not asked again. It needs a session. */
export class RegradeInterviewResolver {
    constructor(@InjectCommandBus() private readonly commandBus: CommandBus) {}

    /** Grades a session again after a failed grading; the transcript is kept and the learner is not asked again. */
    @Mutation(() => InterviewGradingType, { name: "regradeInterview" })
    async regradeInterview(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: InterviewSessionRefInput,
    ): Promise<InterviewGradingType> {
        const result = await this.commandBus.execute(
            new RegradeInterviewCommand(toRegradeInterviewParams(identity, input)),
        )
        return toInterviewGradingType(result)
    }
}
