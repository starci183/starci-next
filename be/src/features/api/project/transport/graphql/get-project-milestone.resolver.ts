import { Args, Query, Resolver } from "@nestjs/graphql"
import type { QueryBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectQueryBus } from "@modules/platform/cqrs"
import { GetProjectMilestoneQuery } from "../../application/get-project-milestone.query"
import { ProjectMilestoneInput } from "./dto/project-milestone.input"
import { ProjectMilestoneType } from "./dto/project-milestone.type"
import { toGetProjectMilestoneParams, toGetProjectMilestoneType } from "./get-project-milestone.mapper"

@Resolver()
/** GraphQL door: reads the concept checklist of one milestone of a project; a milestone past the free ones needs premium; it needs a session. */
export class GetProjectMilestoneResolver {
    constructor(@InjectQueryBus() private readonly queryBus: QueryBus) {}

    /** Reads the concept checklist of one milestone of a project; a milestone past the free ones needs Premium. */
    @Query(() => ProjectMilestoneType, { name: "projectMilestone" })
    async projectMilestone(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: ProjectMilestoneInput,
    ): Promise<ProjectMilestoneType> {
        const result = await this.queryBus.execute(
            new GetProjectMilestoneQuery(toGetProjectMilestoneParams(identity, input)),
        )
        return toGetProjectMilestoneType(result)
    }
}
