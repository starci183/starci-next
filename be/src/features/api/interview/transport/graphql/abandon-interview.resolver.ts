import { Args, Mutation, Resolver } from "@nestjs/graphql"
import type { CommandBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectCommandBus } from "@modules/platform/cqrs"
import { AbandonInterviewCommand } from "../../application/abandon-interview.command"
import { InterviewSessionRefInput } from "./dto/interview-session-ref.input"
import { InterviewAbandonType } from "./dto/interview-abandon.type"
import { toAbandonInterviewParams, toInterviewAbandonType } from "./abandon-interview.mapper"

@Resolver()
/** GraphQL door `abandonInterview`: Abandons the active session; an abandoned free session still counts for its month. It needs a session. */
export class AbandonInterviewResolver {
    constructor(@InjectCommandBus() private readonly commandBus: CommandBus) {}

    /** Abandons the active session; an abandoned free session still counts for its month. */
    @Mutation(() => InterviewAbandonType, { name: "abandonInterview" })
    async abandonInterview(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: InterviewSessionRefInput,
    ): Promise<InterviewAbandonType> {
        const result = await this.commandBus.execute(
            new AbandonInterviewCommand(toAbandonInterviewParams(identity, input)),
        )
        return toInterviewAbandonType(result)
    }
}
