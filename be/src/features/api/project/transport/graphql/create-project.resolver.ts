import { Args, Mutation, Resolver } from "@nestjs/graphql"
import type { CommandBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectCommandBus } from "@modules/platform/cqrs"
import { CreateProjectCommand } from "../../application/create-project.command"
import { CreateProjectInput } from "./dto/create-project.input"
import { ProjectSecretType } from "./dto/project-secret.type"
import { toCreateProjectParams, toCreateProjectType } from "./create-project.mapper"

@Resolver()
/** GraphQL door: creates a project for the signed-in learner and answers it with its ci secret, shown this once; it needs a session. */
export class CreateProjectResolver {
    constructor(@InjectCommandBus() private readonly commandBus: CommandBus) {}

    /** Creates a project for the signed-in learner and answers it with its CI secret, shown this once. */
    @Mutation(() => ProjectSecretType, { name: "createProject" })
    async createProject(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: CreateProjectInput,
    ): Promise<ProjectSecretType> {
        const result = await this.commandBus.execute(new CreateProjectCommand(toCreateProjectParams(identity, input)))
        return toCreateProjectType(result)
    }
}
