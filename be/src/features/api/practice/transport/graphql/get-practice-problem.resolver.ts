import { Args, Query, Resolver } from "@nestjs/graphql"
import type { QueryBus } from "@nestjs/cqrs"
import { MaybePrincipal, Public, PublicReason, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectQueryBus } from "@modules/platform/cqrs"
import { GetPracticeProblemQuery } from "../../application/get-practice-problem.query"
import { PracticeProblemInput } from "./dto/practice-problem.input"
import { PracticeProblemType } from "./dto/practice-problem.type"
import { toGetPracticeProblemParams } from "./get-practice-problem.mapper"
import { toPracticeProblemType } from "./practice-view.mapper"

@Resolver()
/** GraphQL door of one problem; a guest may read it (statement and standing-free), no Premium. */
export class GetPracticeProblemResolver {
    constructor(@InjectQueryBus() private readonly queryBus: QueryBus) {}

    /** Reads one problem; a locked one answers its statement only. */
    @Public({ reason: PublicReason.GuestRead })
    @Query(() => PracticeProblemType, { name: "practiceProblem" })
    async practiceProblem(
        @MaybePrincipal() identity: IdentityPrincipal | undefined,
        @Args("input") input: PracticeProblemInput,
    ): Promise<PracticeProblemType> {
        const result = await this.queryBus.execute(
            new GetPracticeProblemQuery(toGetPracticeProblemParams(identity, input)),
        )
        return toPracticeProblemType(result)
    }
}
