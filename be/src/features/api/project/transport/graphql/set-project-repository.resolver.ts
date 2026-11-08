import { Args, Mutation, Resolver } from "@nestjs/graphql"
import type { CommandBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectCommandBus } from "@modules/platform/cqrs"
import { SetProjectRepositoryCommand } from "../../application/set-project-repository.command"
import { SetProjectRepositoryInput } from "./dto/set-project-repository.input"
import { ProjectRepositoryType } from "./dto/project-repository.type"
import { toProjectRepositoryType } from "./get-project-repository.mapper"
import { toSetProjectRepositoryParams } from "./set-project-repository.mapper"

@Resolver()
/** GraphQL door: binds the learner's own project to a GitHub repository; it needs a session. */
export class SetProjectRepositoryResolver {
    constructor(@InjectCommandBus() private readonly commandBus: CommandBus) {}

    /** Binds the repository and answers the binding. */
    @Mutation(() => ProjectRepositoryType, { name: "setProjectRepository" })
    async setProjectRepository(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: SetProjectRepositoryInput,
    ): Promise<ProjectRepositoryType> {
        const result = await this.commandBus.execute(
            new SetProjectRepositoryCommand(toSetProjectRepositoryParams(identity, input)),
        )
        return toProjectRepositoryType(result)
    }
}
