import { CommandHandler } from "@nestjs/cqrs"
import { ProjectService, type ProjectSecretView } from "@modules/domain/project"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { CreateProjectCommand } from "./create-project.command"

@CommandHandler(CreateProjectCommand)
/** Hands the message to the project capability, which authorizes and decides. */
export class CreateProjectHandler extends ICQRSHandler<CreateProjectCommand, ProjectSecretView> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly projects: ProjectService,
    ) {
        super(logger)
    }

    protected override process(command: CreateProjectCommand): Promise<ProjectSecretView> {
        return this.projects.create({ learnerId: command.params.principal.id, ...command.params.request })
    }
}
