import { CommandHandler } from "@nestjs/cqrs"
import { ProjectService, type ProjectDeletedView } from "@modules/domain/project"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { DeleteProjectCommand } from "./delete-project.command"

@CommandHandler(DeleteProjectCommand)
/** Hands the message to the project capability, which authorizes and decides. */
export class DeleteProjectHandler extends ICQRSHandler<DeleteProjectCommand, ProjectDeletedView> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly projects: ProjectService,
    ) {
        super(logger)
    }

    protected override process(command: DeleteProjectCommand): Promise<ProjectDeletedView> {
        return this.projects.remove(command.params.principal.id, command.params.request.projectId)
    }
}
