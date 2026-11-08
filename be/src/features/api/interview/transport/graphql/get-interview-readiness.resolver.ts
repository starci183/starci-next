import { Args, Query, Resolver } from "@nestjs/graphql"
import type { QueryBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectQueryBus } from "@modules/platform/cqrs"
import { GetInterviewReadinessQuery } from "../../application/get-interview-readiness.query"
import { InterviewReadinessInput } from "./dto/interview-readiness.input"
import { InterviewReadinessType } from "./dto/interview-readiness.type"
import { toGetInterviewReadinessParams, toInterviewReadinessType } from "./get-interview-readiness.mapper"

@Resolver()
/** GraphQL door `interviewReadiness`: Reads the hiring readiness at a track and tier: ready when both pillars passed. It needs a session. */
export class GetInterviewReadinessResolver {
    constructor(@InjectQueryBus() private readonly queryBus: QueryBus) {}

    /** Reads the hiring readiness at a track and tier: ready when both pillars passed. */
    @Query(() => InterviewReadinessType, { name: "interviewReadiness" })
    async interviewReadiness(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: InterviewReadinessInput,
    ): Promise<InterviewReadinessType> {
        const result = await this.queryBus.execute(
            new GetInterviewReadinessQuery(toGetInterviewReadinessParams(identity, input)),
        )
        return toInterviewReadinessType(result)
    }
}
