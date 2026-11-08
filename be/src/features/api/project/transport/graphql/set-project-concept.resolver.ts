import { Args, Mutation, Resolver } from "@nestjs/graphql"
import type { CommandBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectCommandBus } from "@modules/platform/cqrs"
import { SetProjectConceptCommand } from "../../application/set-project-concept.command"
import { SetProjectConceptInput } from "./dto/set-project-concept.input"
import { ProjectConceptType } from "./dto/project-concept.type"
import { toSetProjectConceptParams, toSetProjectConceptType } from "./set-project-concept.mapper"

@Resolver()
/** GraphQL door: points a concept of a project at code and at the endpoint the probes aim at; it needs a session. */
export class SetProjectConceptResolver {
    constructor(@InjectCommandBus() private readonly commandBus: CommandBus) {}

    /** Points a concept of a project at code and at the endpoint the probes aim at. */
    @Mutation(() => ProjectConceptType, { name: "setProjectConcept" })
    async setProjectConcept(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: SetProjectConceptInput,
    ): Promise<ProjectConceptType> {
        const result = await this.commandBus.execute(
            new SetProjectConceptCommand(toSetProjectConceptParams(identity, input)),
        )
        return toSetProjectConceptType(result)
    }
}
