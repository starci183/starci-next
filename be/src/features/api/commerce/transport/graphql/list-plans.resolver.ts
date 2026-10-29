import { Query, Resolver } from "@nestjs/graphql"
import type { QueryBus } from "@nestjs/cqrs"
import { Public, PublicReason } from "@modules/domain/identity"
import { InjectQueryBus } from "@modules/platform/cqrs"
import { ListPlansQuery } from "../../application/list-plans.query"
import { toPlanTypes } from "./list-plans.mapper"
import { PlanType } from "./dto/plan.type"

@Resolver()
/** GraphQL door of the public Premium plans read. */
export class ListPlansResolver {
    constructor(@InjectQueryBus() private readonly queryBus: QueryBus) {}

    /** Lists the server-owned Premium offers; prices are fixed server-side and carry no caller data. */
    @Query(() => [PlanType], { name: "premiumPlans" })
    @Public({ reason: PublicReason.CatalogRead })
    async premiumPlans(): Promise<Array<PlanType>> {
        const result = await this.queryBus.execute(new ListPlansQuery({ request: {} }))
        return toPlanTypes(result)
    }
}
