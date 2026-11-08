import { Args, Query, Resolver } from "@nestjs/graphql"
import type { QueryBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectQueryBus } from "@modules/platform/cqrs"
import { GetProjectCatalogQuery } from "../../application/get-project-catalog.query"
import { ProjectCatalogInput } from "./dto/project-catalog.input"
import { ProjectCatalogType } from "./dto/project-catalog.type"
import { toGetProjectCatalogParams, toGetProjectCatalogType } from "./get-project-catalog.mapper"

@Resolver()
/** GraphQL door: reads the milestones and concepts a project can pursue; it needs a session. */
export class GetProjectCatalogResolver {
    constructor(@InjectQueryBus() private readonly queryBus: QueryBus) {}

    /** Reads the milestones and concepts a project can pursue. */
    @Query(() => ProjectCatalogType, { name: "projectCatalog" })
    async projectCatalog(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: ProjectCatalogInput,
    ): Promise<ProjectCatalogType> {
        const result = await this.queryBus.execute(
            new GetProjectCatalogQuery(toGetProjectCatalogParams(identity, input)),
        )
        return toGetProjectCatalogType(result)
    }
}
