import { Query, Resolver } from "@nestjs/graphql"
import type { QueryBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectQueryBus } from "@modules/platform/cqrs"
import { GetMyPremiumQuery } from "../../application/get-my-premium.query"
import { toGetMyPremiumParams, toMyPremiumType } from "./get-my-premium.mapper"
import { MyPremiumType } from "./dto/my-premium.type"

@Resolver()
/** GraphQL door of myPremium: a signed-in learner reads their own Premium standing. */
export class GetMyPremiumResolver {
    constructor(@InjectQueryBus() private readonly queryBus: QueryBus) {}

    /** Reads the caller access now, its stored end and the last rail used. */
    @Query(() => MyPremiumType, { name: "myPremium" })
    async myPremium(@CurrentPrincipal() identity: IdentityPrincipal): Promise<MyPremiumType> {
        const result = await this.queryBus.execute(new GetMyPremiumQuery(toGetMyPremiumParams(identity)))
        return toMyPremiumType(result)
    }
}
