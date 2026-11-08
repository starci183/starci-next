import { Args, Query, Resolver } from "@nestjs/graphql"
import type { QueryBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectQueryBus } from "@modules/platform/cqrs"
import { GetProjectQuery } from "../../application/get-project.query"
import { ProjectInput } from "./dto/project.input"
import { ProjectDetailType } from "./dto/project-detail.type"
import { toGetProjectParams, toGetProjectType } from "./get-project.mapper"

@Resolver()
/** GraphQL door: reads one project of the signed-in learner with its milestones, practice and proof; it needs a session. */
export class GetProjectResolver {
    constructor(@InjectQueryBus() private readonly queryBus: QueryBus) {}

    /** Reads one project of the signed-in learner with its milestones, practice and proof. */
    @Query(() => ProjectDetailType, { name: "project" })
    async project(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: ProjectInput,
    ): Promise<ProjectDetailType> {
        const result = await this.queryBus.execute(new GetProjectQuery(toGetProjectParams(identity, input)))
        return toGetProjectType(result)
    }
}
