import { Args, Query, Resolver } from "@nestjs/graphql"
import type { QueryBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectQueryBus } from "@modules/platform/cqrs"
import { GetPracticeSubmissionQuery } from "../../application/get-practice-submission.query"
import { PracticeSubmissionInput } from "./dto/practice-submission.input"
import { PracticeSubmissionType } from "./dto/practice-submission.type"
import { toGetPracticeSubmissionParams } from "./get-practice-submission.mapper"
import { toPracticeSubmissionType } from "./practice-view.mapper"

@Resolver()
/** GraphQL door of one submission; it needs a session and no Premium. */
export class GetPracticeSubmissionResolver {
    constructor(@InjectQueryBus() private readonly queryBus: QueryBus) {}

    /** Reads one submission of the caller; poll it while it is QUEUED or RUNNING. */
    @Query(() => PracticeSubmissionType, { name: "practiceSubmission" })
    async practiceSubmission(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: PracticeSubmissionInput,
    ): Promise<PracticeSubmissionType> {
        const result = await this.queryBus.execute(
            new GetPracticeSubmissionQuery(toGetPracticeSubmissionParams(identity, input)),
        )
        return toPracticeSubmissionType(result)
    }
}
