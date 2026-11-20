import { Args, Query, Resolver } from "@nestjs/graphql"
import type { QueryBus } from "@nestjs/cqrs"
import { MaybePrincipal, Public, PublicReason, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectQueryBus } from "@modules/platform/cqrs"
import { ListPracticeProblemsQuery } from "../../application/list-practice-problems.query"
import { PracticeProblemsInput } from "./dto/practice-problems.input"
import { PracticeProblemItemType } from "./dto/practice-problem-item.type"
import { toListPracticeProblemsParams } from "./list-practice-problems.mapper"
import { toPracticeProblemItemTypes } from "./practice-view.mapper"

@Resolver()
/** GraphQL door of the problems of a pattern; a guest may read it (statement and standing-free), no Premium. */
export class ListPracticeProblemsResolver {
    constructor(@InjectQueryBus() private readonly queryBus: QueryBus) {}

    /** Lists the problems of a pattern in order, with the standing of the viewer. */
    @Public({ reason: PublicReason.GuestRead })
    @Query(() => [PracticeProblemItemType], { name: "practiceProblems" })
    async practiceProblems(
        @MaybePrincipal() identity: IdentityPrincipal | undefined,
        @Args("input") input: PracticeProblemsInput,
    ): Promise<Array<PracticeProblemItemType>> {
        const result = await this.queryBus.execute(
            new ListPracticeProblemsQuery(toListPracticeProblemsParams(identity, input)),
        )
        return toPracticeProblemItemTypes(result)
    }
}
