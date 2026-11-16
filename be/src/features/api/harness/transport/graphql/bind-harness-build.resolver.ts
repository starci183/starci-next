import { Args, Mutation, Resolver } from "@nestjs/graphql"
import type { CommandBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectCommandBus } from "@modules/platform/cqrs"
import { BindHarnessBuildCommand } from "../../application/bind-harness-build.command"
import { BindHarnessBuildInput } from "./dto/bind-harness-build.input"
import { HarnessBuildBindingType } from "./dto/harness-build-binding.type"
import { toBindParams } from "./harness.mapper"

@Resolver()
/** GraphQL door that binds a harness build to the learner agent project; it needs a session and no Premium. */
export class BindHarnessBuildResolver {
    constructor(@InjectCommandBus() private readonly commandBus: CommandBus) {}

    /** Binds a build; a project that is not the learner own agent project is refused. */
    @Mutation(() => HarnessBuildBindingType, { name: "bindHarnessBuild" })
    async bindHarnessBuild(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: BindHarnessBuildInput,
    ): Promise<HarnessBuildBindingType> {
        return this.commandBus.execute(new BindHarnessBuildCommand(toBindParams(identity, input)))
    }
}
