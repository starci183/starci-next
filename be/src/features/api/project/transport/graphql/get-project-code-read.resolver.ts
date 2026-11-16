import { Args, Query, Resolver } from "@nestjs/graphql"
import type { QueryBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectQueryBus } from "@modules/platform/cqrs"
import { GetProjectCodeReadQuery } from "../../application/get-project-code-read.query"
import { ProjectConceptInput } from "./dto/project-concept.input"
import { ProjectCodeReadType } from "./dto/project-code-read.type"
import { toGetProjectCodeReadParams, toGetProjectCodeReadType } from "./get-project-code-read.mapper"

@Resolver()
/** GraphQL door: reads the newest AI code read of a concept of a project with every criterion's verdict; it needs a session and Premium. */
export class GetProjectCodeReadResolver {
    constructor(@InjectQueryBus() private readonly queryBus: QueryBus) {}

    /** Reads the newest AI code read of a concept of a project; null when there is none. A learner without Premium is refused PROJECT_PREMIUM_REQUIRED. */
    @Query(() => ProjectCodeReadType, { name: "projectCodeRead", nullable: true })
    async projectCodeRead(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: ProjectConceptInput,
    ): Promise<ProjectCodeReadType | null> {
        const result = await this.queryBus.execute(
            new GetProjectCodeReadQuery(toGetProjectCodeReadParams(identity, input)),
        )
        return toGetProjectCodeReadType(result)
    }
}
