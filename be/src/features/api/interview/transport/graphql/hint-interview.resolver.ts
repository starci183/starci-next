import { Args, Mutation, Resolver } from "@nestjs/graphql"
import type { CommandBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectCommandBus } from "@modules/platform/cqrs"
import { HintInterviewCommand } from "../../application/hint-interview.command"
import { InterviewHintInput } from "./dto/interview-hint.input"
import { InterviewHintType } from "./dto/interview-hint.type"
import { toHintInterviewParams, toInterviewHintType } from "./hint-interview.mapper"

@Resolver()
/** GraphQL door `interviewHint`: Gives the next authored hint of the open question; each hint used takes a little off that question. It needs a session. */
export class HintInterviewResolver {
    constructor(@InjectCommandBus() private readonly commandBus: CommandBus) {}

    /** Gives the next authored hint of the open question; each hint used takes a little off that question. */
    @Mutation(() => InterviewHintType, { name: "interviewHint" })
    async interviewHint(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: InterviewHintInput,
    ): Promise<InterviewHintType> {
        const result = await this.commandBus.execute(new HintInterviewCommand(toHintInterviewParams(identity, input)))
        return toInterviewHintType(result)
    }
}
