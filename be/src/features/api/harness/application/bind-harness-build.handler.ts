import { CommandHandler } from "@nestjs/cqrs"
import { HarnessError, HarnessErrorCode, HarnessProofService } from "@modules/domain/harness"
import { ProjectReadService } from "@modules/domain/project"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { BindHarnessBuildCommand, type HarnessBinding } from "./bind-harness-build.command"

@CommandHandler(BindHarnessBuildCommand)
/**
 * Binds a build to a project after the project capability proves the project is the learner own agent project (another learner
 * project is not found, an app project is HARNESS_PROJECT_INVALID); the harness then stores the binding.
 */
export class BindHarnessBuildHandler extends ICQRSHandler<BindHarnessBuildCommand, HarnessBinding> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly projects: ProjectReadService,
        private readonly proof: HarnessProofService,
    ) {
        super(logger)
    }

    protected override async process(command: BindHarnessBuildCommand): Promise<HarnessBinding> {
        const learnerId = command.params.principal.id
        const { buildId, projectId } = command.params.request
        const project = await this.projects.summary({ learnerId, projectId, locale: "vi" })
        if (project.kind !== "agent") throw new HarnessError({ code: HarnessErrorCode.ProjectInvalid })
        return this.proof.bind(learnerId, buildId, projectId)
    }
}
