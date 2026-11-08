import { Query, Resolver } from "@nestjs/graphql"
import type { QueryBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectQueryBus } from "@modules/platform/cqrs"
import { GetStreakQuery } from "../../application/get-streak.query"
import { StreakType } from "./dto/streak.type"
import { toStreakParams, toStreakType } from "./streak.mapper"

@Resolver()
/** GraphQL door of the whole streak of the learner: 30 days, the week, the freezes, the counters and the badges; it needs a session. */
export class StreakResolver {
    constructor(@InjectQueryBus() private readonly queryBus: QueryBus) {}

    /** Reads the streak of the learner who asks. */
    @Query(() => StreakType, { name: "streak" })
    async streak(@CurrentPrincipal() identity: IdentityPrincipal): Promise<StreakType> {
        const result = await this.queryBus.execute(new GetStreakQuery(toStreakParams(identity)))
        return toStreakType(result)
    }
}
