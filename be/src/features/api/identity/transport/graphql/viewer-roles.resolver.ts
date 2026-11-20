import { Query, Resolver } from "@nestjs/graphql"
import type { QueryBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectQueryBus } from "@modules/platform/cqrs"
import { GetViewerRolesQuery } from "../../application/get-viewer-roles.query"
import { toGetViewerRolesParams } from "./viewer-roles.mapper"

@Resolver()
/** GraphQL door viewerRoles; it needs a session. */
export class ViewerRolesResolver {
    constructor(@InjectQueryBus() private readonly queryBus: QueryBus) {}

    /** The roles of the signed-in account (for example `reviewer`), so a page can choose what to draw; the doors check the role again. */
    @Query(() => [String], { name: "viewerRoles" })
    viewerRoles(@CurrentPrincipal() identity: IdentityPrincipal): Promise<ReadonlyArray<string>> {
        return this.queryBus.execute(new GetViewerRolesQuery(toGetViewerRolesParams(identity)))
    }
}
