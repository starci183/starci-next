import { Args, Query, Resolver } from "@nestjs/graphql"
import type { QueryBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectQueryBus } from "@modules/platform/cqrs"
import { ListPracticeReadinessQuery } from "../../application/list-practice-readiness.query"
import { PracticeReadinessInput } from "./dto/practice-readiness.input"
import { PracticeReadinessItemType } from "./dto/practice-readiness-item.type"
import { toListPracticeReadinessParams } from "./list-practice-readiness.mapper"
import { toPracticeReadinessItemTypes } from "./practice-view.mapper"

@Resolver()
/** GraphQL door of the readiness per pattern; it needs a session and no Premium. */
export class ListPracticeReadinessResolver {
    constructor(@InjectQueryBus() private readonly queryBus: QueryBus) {}

    /** Counts the accepted problems of the caller per pattern. */
    @Query(() => [PracticeReadinessItemType], { name: "practiceReadiness" })
    async practiceReadiness(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: PracticeReadinessInput,
    ): Promise<Array<PracticeReadinessItemType>> {
        const result = await this.queryBus.execute(
            new ListPracticeReadinessQuery(toListPracticeReadinessParams(identity, input)),
        )
        return toPracticeReadinessItemTypes(result)
    }
}
