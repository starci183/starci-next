import { Args, Query, Resolver } from "@nestjs/graphql"
import type { QueryBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectQueryBus } from "@modules/platform/cqrs"
import { ListProjectsQuery } from "../../application/list-projects.query"
import { ProjectsInput } from "./dto/projects.input"
import { ProjectSummaryType } from "./dto/project-summary.type"
import { toListProjectsParams, toListProjectsType } from "./list-projects.mapper"

@Resolver()
/** GraphQL door: lists the projects of the signed-in learner, each with its progress; it needs a session. */
export class ListProjectsResolver {
    constructor(@InjectQueryBus() private readonly queryBus: QueryBus) {}

    /** Lists the projects of the signed-in learner, each with its progress. */
    @Query(() => [ProjectSummaryType], { name: "projects" })
    async projects(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: ProjectsInput,
    ): Promise<ReadonlyArray<ProjectSummaryType>> {
        const result = await this.queryBus.execute(new ListProjectsQuery(toListProjectsParams(identity, input)))
        return toListProjectsType(result)
    }
}
