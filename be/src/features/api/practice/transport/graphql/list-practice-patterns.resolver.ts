import { Args, Query, Resolver } from "@nestjs/graphql"
import type { QueryBus } from "@nestjs/cqrs"
import { MaybePrincipal, Public, PublicReason, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectQueryBus } from "@modules/platform/cqrs"
import { ListPracticePatternsQuery } from "../../application/list-practice-patterns.query"
import { PracticePatternsInput } from "./dto/practice-patterns.input"
import { PracticePatternType } from "./dto/practice-pattern.type"
import { toListPracticePatternsParams } from "./list-practice-patterns.mapper"
import { toPracticePatternTypes } from "./practice-view.mapper"

@Resolver()
/** GraphQL door of the pattern list; a guest may read it (statement and standing-free), no Premium. */
export class ListPracticePatternsResolver {
    constructor(@InjectQueryBus() private readonly queryBus: QueryBus) {}

    /** Lists the patterns that have problems, with the counts and the lock state of the viewer. */
    @Public({ reason: PublicReason.GuestRead })
    @Query(() => [PracticePatternType], { name: "practicePatterns" })
    async practicePatterns(
        @MaybePrincipal() identity: IdentityPrincipal | undefined,
        @Args("input") input: PracticePatternsInput,
    ): Promise<Array<PracticePatternType>> {
        const result = await this.queryBus.execute(
            new ListPracticePatternsQuery(toListPracticePatternsParams(identity, input)),
        )
        return toPracticePatternTypes(result)
    }
}
