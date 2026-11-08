import { Query, Resolver } from "@nestjs/graphql"
import type { QueryBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectQueryBus } from "@modules/platform/cqrs"
import { GetInterviewEvidenceQuery } from "../../application/get-interview-evidence.query"
import { InterviewEvidenceType } from "./dto/interview-evidence.type"
import { toGetInterviewEvidenceParams, toInterviewEvidenceType } from "./get-interview-evidence.mapper"

@Resolver()
/** GraphQL door `interviewEvidence`: Reads the best graded result of the learner per track, pillar and tier: the interview evidence of the profile. It needs a session. */
export class GetInterviewEvidenceResolver {
    constructor(@InjectQueryBus() private readonly queryBus: QueryBus) {}

    /** Reads the best graded result of the learner per track, pillar and tier: the interview evidence of the profile. */
    @Query(() => [InterviewEvidenceType], { name: "interviewEvidence" })
    async interviewEvidence(
        @CurrentPrincipal() identity: IdentityPrincipal,
    ): Promise<ReadonlyArray<InterviewEvidenceType>> {
        const result = await this.queryBus.execute(
            new GetInterviewEvidenceQuery(toGetInterviewEvidenceParams(identity)),
        )
        return toInterviewEvidenceType(result)
    }
}
