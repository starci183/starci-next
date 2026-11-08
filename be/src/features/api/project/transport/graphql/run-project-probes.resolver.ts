import { Args, Mutation, Resolver } from "@nestjs/graphql"
import type { CommandBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectCommandBus } from "@modules/platform/cqrs"
import { RunProjectProbesCommand } from "../../application/run-project-probes.command"
import { RunProjectProbesInput } from "./dto/run-project-probes.input"
import { ProjectProbeRunType } from "./dto/project-probe-run.type"
import { toRunProjectProbesParams, toRunProjectProbesType } from "./run-project-probes.mapper"

@Resolver()
/** GraphQL door: probes the deployed address of a project with the generic starci probes; it needs a session. */
export class RunProjectProbesResolver {
    constructor(@InjectCommandBus() private readonly commandBus: CommandBus) {}

    /** Probes the deployed address of a project with the generic StarCi probes. */
    @Mutation(() => ProjectProbeRunType, { name: "runProjectProbes" })
    async runProjectProbes(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: RunProjectProbesInput,
    ): Promise<ProjectProbeRunType> {
        const result = await this.commandBus.execute(
            new RunProjectProbesCommand(toRunProjectProbesParams(identity, input)),
        )
        return toRunProjectProbesType(result)
    }
}
