import { Args, Query, Resolver } from "@nestjs/graphql"
import type { QueryBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectQueryBus } from "@modules/platform/cqrs"
import { GetProjectRepositoryQuery } from "../../application/get-project-repository.query"
import { ProjectRepositoryInput } from "./dto/project-repository.input"
import { ProjectRepositoryType } from "./dto/project-repository.type"
import { toGetProjectRepositoryParams, toProjectRepositoryType } from "./get-project-repository.mapper"

@Resolver()
/** GraphQL door: the GitHub repository of the learner's own project and its CI OIDC audience; it needs a session. */
export class GetProjectRepositoryResolver {
    constructor(@InjectQueryBus() private readonly queryBus: QueryBus) {}

    /** Reads the binding the CI snippet card shows. */
    @Query(() => ProjectRepositoryType, { name: "projectRepository" })
    async projectRepository(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: ProjectRepositoryInput,
    ): Promise<ProjectRepositoryType> {
        const result = await this.queryBus.execute(
            new GetProjectRepositoryQuery(toGetProjectRepositoryParams(identity, input)),
        )
        return toProjectRepositoryType(result)
    }
}
