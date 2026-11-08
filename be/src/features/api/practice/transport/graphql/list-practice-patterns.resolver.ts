import { Args, Query, Resolver } from "@nestjs/graphql"
import type { QueryBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectQueryBus } from "@modules/platform/cqrs"
import { ListPracticePatternsQuery } from "../../application/list-practice-patterns.query"
import { PracticePatternsInput } from "./dto/practice-patterns.input"
import { PracticePatternType } from "./dto/practice-pattern.type"
import { toListPracticePatternsParams } from "./list-practice-patterns.mapper"
import { toPracticePatternTypes } from "./practice-view.mapper"

@Resolver()
/** GraphQL door of the pattern list; it needs a session and no Premium. */
export class ListPracticePatternsResolver {
    constructor(@InjectQueryBus() private readonly queryBus: QueryBus) {}

    /** Lists the patterns that have problems, with the counts and the lock state of the viewer. */
    @Query(() => [PracticePatternType], { name: "practicePatterns" })
    async practicePatterns(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: PracticePatternsInput,
    ): Promise<Array<PracticePatternType>> {
        const result = await this.queryBus.execute(
            new ListPracticePatternsQuery(toListPracticePatternsParams(identity, input)),
        )
        return toPracticePatternTypes(result)
    }
}
