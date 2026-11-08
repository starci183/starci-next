import { Args, Query, Resolver } from "@nestjs/graphql"
import type { QueryBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectQueryBus } from "@modules/platform/cqrs"
import { ListIncidentsQuery } from "../../application/list-incidents.query"
import { IncidentListItemType } from "./dto/incident-list-item.type"
import { IncidentsInput } from "./dto/incidents.input"
import { toIncidentListItemTypes, toListIncidentsParams } from "./list-incidents.mapper"

@Resolver()
/** GraphQL door of the incident list; it needs a session and no Premium. */
export class IncidentsResolver {
    constructor(@InjectQueryBus() private readonly queryBus: QueryBus) {}

    /** Lists the live Essentials lessons with whether their tier-2 incident is written. */
    @Query(() => [IncidentListItemType], { name: "incidents" })
    async incidents(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: IncidentsInput,
    ): Promise<Array<IncidentListItemType>> {
        const result = await this.queryBus.execute(new ListIncidentsQuery(toListIncidentsParams(identity, input)))
        return toIncidentListItemTypes(result)
    }
}
