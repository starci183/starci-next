import { CommandHandler } from "@nestjs/cqrs"
import { ProjectService, type ProjectSummaryView } from "@modules/domain/project"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { UpdateProjectCommand } from "./update-project.command"

@CommandHandler(UpdateProjectCommand)
/** Hands the message to the project capability, which authorizes and decides. */
export class UpdateProjectHandler extends ICQRSHandler<UpdateProjectCommand, ProjectSummaryView> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly projects: ProjectService,
    ) {
        super(logger)
    }

    protected override process(command: UpdateProjectCommand): Promise<ProjectSummaryView> {
        return this.projects.update({ learnerId: command.params.principal.id, ...command.params.request })
    }
}
