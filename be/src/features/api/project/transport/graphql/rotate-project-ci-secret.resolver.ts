import { Args, Mutation, Resolver } from "@nestjs/graphql"
import type { CommandBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectCommandBus } from "@modules/platform/cqrs"
import { RotateProjectCiSecretCommand } from "../../application/rotate-project-ci-secret.command"
import { RotateProjectCiSecretInput } from "./dto/rotate-project-ci-secret.input"
import { ProjectSecretType } from "./dto/project-secret.type"
import { toRotateProjectCiSecretParams, toRotateProjectCiSecretType } from "./rotate-project-ci-secret.mapper"

@Resolver()
/** GraphQL door: replaces the ci secret of a project and answers the new one, shown this once; it needs a session. */
export class RotateProjectCiSecretResolver {
    constructor(@InjectCommandBus() private readonly commandBus: CommandBus) {}

    /** Replaces the CI secret of a project and answers the new one, shown this once. */
    @Mutation(() => ProjectSecretType, { name: "rotateProjectCiSecret" })
    async rotateProjectCiSecret(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: RotateProjectCiSecretInput,
    ): Promise<ProjectSecretType> {
        const result = await this.commandBus.execute(
            new RotateProjectCiSecretCommand(toRotateProjectCiSecretParams(identity, input)),
        )
        return toRotateProjectCiSecretType(result)
    }
}
