import { Args, Query, Resolver } from "@nestjs/graphql"
import type { QueryBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectQueryBus } from "@modules/platform/cqrs"
import { GetInterviewHistoryQuery } from "../../application/get-interview-history.query"
import { InterviewHistoryInput } from "./dto/interview-history.input"
import { InterviewHistoryType } from "./dto/interview-history.type"
import { toGetInterviewHistoryParams, toInterviewHistoryType } from "./get-interview-history.mapper"

@Resolver()
/** GraphQL door `interviewHistory`: Reads the sessions of the learner and the score trend per track and tier. It needs a session. */
export class GetInterviewHistoryResolver {
    constructor(@InjectQueryBus() private readonly queryBus: QueryBus) {}

    /** Reads the sessions of the learner and the score trend per track and tier. */
    @Query(() => InterviewHistoryType, { name: "interviewHistory" })
    async interviewHistory(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: InterviewHistoryInput,
    ): Promise<InterviewHistoryType> {
        const result = await this.queryBus.execute(
            new GetInterviewHistoryQuery(toGetInterviewHistoryParams(identity, input)),
        )
        return toInterviewHistoryType(result)
    }
}
