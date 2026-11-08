import { Args, Mutation, Resolver } from "@nestjs/graphql"
import type { CommandBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectCommandBus } from "@modules/platform/cqrs"
import { UpdateProjectCommand } from "../../application/update-project.command"
import { UpdateProjectInput } from "./dto/update-project.input"
import { ProjectSummaryType } from "./dto/project-summary.type"
import { toUpdateProjectParams, toUpdateProjectType } from "./update-project.mapper"

@Resolver()
/** GraphQL door: changes a project of the signed-in learner; it needs a session. */
export class UpdateProjectResolver {
    constructor(@InjectCommandBus() private readonly commandBus: CommandBus) {}

    /** Changes a project of the signed-in learner. */
    @Mutation(() => ProjectSummaryType, { name: "updateProject" })
    async updateProject(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: UpdateProjectInput,
    ): Promise<ProjectSummaryType> {
        const result = await this.commandBus.execute(new UpdateProjectCommand(toUpdateProjectParams(identity, input)))
        return toUpdateProjectType(result)
    }
}
