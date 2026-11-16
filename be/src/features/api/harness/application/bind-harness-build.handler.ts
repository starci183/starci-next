import { CommandHandler } from "@nestjs/cqrs"
import { HarnessProofService, type HarnessBindingView } from "@modules/domain/harness"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { BindHarnessBuildCommand } from "./bind-harness-build.command"

@CommandHandler(BindHarnessBuildCommand)
/**
 * Binds a build to a GitHub repository of the learner. /harness is free, so this asks neither the project capability nor the
 * entitlement question: a learner without Premium binds and proves a build, and still cannot create a Project.
 */
export class BindHarnessBuildHandler extends ICQRSHandler<BindHarnessBuildCommand, HarnessBindingView> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly proof: HarnessProofService,
    ) {
        super(logger)
    }

    protected override process(command: BindHarnessBuildCommand): Promise<HarnessBindingView> {
        const { buildId, repository } = command.params.request
        return this.proof.bind(command.params.principal.id, buildId, repository)
    }
}
