import { Args, Mutation, Resolver } from "@nestjs/graphql"
import type { CommandBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectCommandBus } from "@modules/platform/cqrs"
import { StartInterviewCommand } from "../../application/start-interview.command"
import { StartInterviewInput } from "./dto/start-interview.input"
import { InterviewSessionType } from "./dto/interview-session.type"
import { toStartInterviewParams, toInterviewSessionTypeOf } from "./start-interview.mapper"

@Resolver()
/** GraphQL door `startInterview`: Starts a session: the quota is checked, the questions are drawn and the first prompt is stored. It makes no AI call. It needs a session. */
export class StartInterviewResolver {
    constructor(@InjectCommandBus() private readonly commandBus: CommandBus) {}

    /** Starts a session: the quota is checked, the questions are drawn and the first prompt is stored. It makes no AI call. */
    @Mutation(() => InterviewSessionType, { name: "startInterview" })
    async startInterview(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: StartInterviewInput,
    ): Promise<InterviewSessionType> {
        const result = await this.commandBus.execute(new StartInterviewCommand(toStartInterviewParams(identity, input)))
        return toInterviewSessionTypeOf(result)
    }
}
