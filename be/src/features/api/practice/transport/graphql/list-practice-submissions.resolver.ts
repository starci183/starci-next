import { Args, Query, Resolver } from "@nestjs/graphql"
import type { QueryBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectQueryBus } from "@modules/platform/cqrs"
import { ListPracticeSubmissionsQuery } from "../../application/list-practice-submissions.query"
import { PracticeSubmissionPageType } from "./dto/practice-submission-page.type"
import { PracticeSubmissionsInput } from "./dto/practice-submissions.input"
import { toListPracticeSubmissionsParams } from "./list-practice-submissions.mapper"
import { toPracticeSubmissionPageType } from "./practice-view.mapper"

@Resolver()
/** GraphQL door of the caller's own graded submits in a pattern; it needs a session and no Premium. */
export class ListPracticeSubmissionsResolver {
    constructor(@InjectQueryBus() private readonly queryBus: QueryBus) {}

    /** Lists the caller's own graded submits of one pattern, newest first, page by page. */
    @Query(() => PracticeSubmissionPageType, { name: "practiceSubmissions" })
    async practiceSubmissions(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: PracticeSubmissionsInput,
    ): Promise<PracticeSubmissionPageType> {
        const result = await this.queryBus.execute(
            new ListPracticeSubmissionsQuery(toListPracticeSubmissionsParams(identity, input)),
        )
        return toPracticeSubmissionPageType(result)
    }
}
