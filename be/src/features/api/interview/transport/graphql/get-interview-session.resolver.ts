import { Args, Query, Resolver } from "@nestjs/graphql"
import type { QueryBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectQueryBus } from "@modules/platform/cqrs"
import { GetInterviewSessionQuery } from "../../application/get-interview-session.query"
import { InterviewSessionRefInput } from "./dto/interview-session-ref.input"
import { InterviewSessionType } from "./dto/interview-session.type"
import { toGetInterviewSessionParams, toInterviewSessionTypeOf } from "./get-interview-session.mapper"

@Resolver()
/** GraphQL door `interviewSession`: Reads a session; the scorecard, the ideal answers and the lessons appear only once it is graded. It needs a session. */
export class GetInterviewSessionResolver {
    constructor(@InjectQueryBus() private readonly queryBus: QueryBus) {}

    /** Reads a session; the scorecard, the ideal answers and the lessons appear only once it is graded. */
    @Query(() => InterviewSessionType, { name: "interviewSession" })
    async interviewSession(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: InterviewSessionRefInput,
    ): Promise<InterviewSessionType> {
        const result = await this.queryBus.execute(
            new GetInterviewSessionQuery(toGetInterviewSessionParams(identity, input)),
        )
        return toInterviewSessionTypeOf(result)
    }
}
