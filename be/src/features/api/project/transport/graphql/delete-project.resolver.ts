import { Args, Mutation, Resolver } from "@nestjs/graphql"
import type { CommandBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectCommandBus } from "@modules/platform/cqrs"
import { DeleteProjectCommand } from "../../application/delete-project.command"
import { DeleteProjectInput } from "./dto/delete-project.input"
import { ProjectDeletedType } from "./dto/project-deleted.type"
import { toDeleteProjectParams, toDeleteProjectType } from "./delete-project.mapper"

@Resolver()
/** GraphQL door: deletes a project of the signed-in learner with its evidence; it needs a session. */
export class DeleteProjectResolver {
    constructor(@InjectCommandBus() private readonly commandBus: CommandBus) {}

    /** Deletes a project of the signed-in learner with its evidence. */
    @Mutation(() => ProjectDeletedType, { name: "deleteProject" })
    async deleteProject(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: DeleteProjectInput,
    ): Promise<ProjectDeletedType> {
        const result = await this.commandBus.execute(new DeleteProjectCommand(toDeleteProjectParams(identity, input)))
        return toDeleteProjectType(result)
    }
}
