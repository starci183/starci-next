import { Args, Query, Resolver } from "@nestjs/graphql"
import type { QueryBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectQueryBus } from "@modules/platform/cqrs"
import { GetProjectCvPreviewQuery } from "../../application/get-project-cv-preview.query"
import { ProjectCvPreviewInput } from "./dto/project-cv-preview.input"
import { ProjectCvPreviewType } from "./dto/project-cv-preview.type"
import { toGetProjectCvPreviewParams, toGetProjectCvPreviewType } from "./get-project-cv-preview.mapper"

@Resolver()
/** GraphQL door: previews the CV line of a concept or a milestone of a project with its proof; it needs a session and Premium. */
export class GetProjectCvPreviewResolver {
    constructor(@InjectQueryBus() private readonly queryBus: QueryBus) {}

    /** Previews the CV line of a concept or a milestone with the proof under it. A learner without Premium is refused PROJECT_PREMIUM_REQUIRED. */
    @Query(() => ProjectCvPreviewType, { name: "projectCvPreview" })
    async projectCvPreview(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: ProjectCvPreviewInput,
    ): Promise<ProjectCvPreviewType> {
        const result = await this.queryBus.execute(
            new GetProjectCvPreviewQuery(toGetProjectCvPreviewParams(identity, input)),
        )
        return toGetProjectCvPreviewType(result)
    }
}
