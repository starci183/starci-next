import { CommandHandler } from "@nestjs/cqrs"
import { ProjectService, type ProjectSecretView } from "@modules/domain/project"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { RotateProjectCiSecretCommand } from "./rotate-project-ci-secret.command"

@CommandHandler(RotateProjectCiSecretCommand)
/** Hands the message to the project capability, which authorizes and decides. */
export class RotateProjectCiSecretHandler extends ICQRSHandler<RotateProjectCiSecretCommand, ProjectSecretView> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly projects: ProjectService,
    ) {
        super(logger)
    }

    protected override process(command: RotateProjectCiSecretCommand): Promise<ProjectSecretView> {
        return this.projects.rotateSecret({ learnerId: command.params.principal.id, ...command.params.request })
    }
}
