import { Args, Query, Resolver } from "@nestjs/graphql"
import type { QueryBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectQueryBus } from "@modules/platform/cqrs"
import { GetInterviewOptionsQuery } from "../../application/get-interview-options.query"
import { InterviewOptionsInput } from "./dto/interview-options.input"
import { InterviewOptionsType } from "./dto/interview-options.type"
import { toGetInterviewOptionsParams, toInterviewOptionsType } from "./get-interview-options.mapper"

@Resolver()
/** GraphQL door `interviewOptions`: Reads the tracks, the live banks, the access of the learner and the session in progress. It needs a session. */
export class GetInterviewOptionsResolver {
    constructor(@InjectQueryBus() private readonly queryBus: QueryBus) {}

    /** Reads the tracks, the live banks, the access of the learner and the session in progress. */
    @Query(() => InterviewOptionsType, { name: "interviewOptions" })
    async interviewOptions(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: InterviewOptionsInput,
    ): Promise<InterviewOptionsType> {
        const result = await this.queryBus.execute(
            new GetInterviewOptionsQuery(toGetInterviewOptionsParams(identity, input)),
        )
        return toInterviewOptionsType(result)
    }
}
