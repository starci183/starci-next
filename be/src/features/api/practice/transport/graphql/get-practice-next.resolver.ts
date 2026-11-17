import { Args, Query, Resolver } from "@nestjs/graphql"
import type { QueryBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectQueryBus } from "@modules/platform/cqrs"
import { GetPracticeNextQuery } from "../../application/get-practice-next.query"
import { PracticeNextInput } from "./dto/practice-next.input"
import { PracticeNextType } from "./dto/practice-next.type"
import { toGetPracticeNextParams } from "./get-practice-next.mapper"
import { toPracticeNextType } from "./practice-view.mapper"

@Resolver()
/** GraphQL door of the next and the resume problem; it needs a session and no Premium. */
export class GetPracticeNextResolver {
    constructor(@InjectQueryBus() private readonly queryBus: QueryBus) {}

    /** Asks where to go next in practice: the first problem not yet accepted and the problem to resume. */
    @Query(() => PracticeNextType, { name: "practiceNext" })
    async practiceNext(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: PracticeNextInput,
    ): Promise<PracticeNextType> {
        const result = await this.queryBus.execute(new GetPracticeNextQuery(toGetPracticeNextParams(identity, input)))
        return toPracticeNextType(result)
    }
}
