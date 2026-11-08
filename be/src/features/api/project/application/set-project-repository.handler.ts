import { CommandHandler } from "@nestjs/cqrs"
import { ProjectRepositoryService, type ProjectRepositoryView } from "@modules/domain/project"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { SetProjectRepositoryCommand } from "./set-project-repository.command"

@CommandHandler(SetProjectRepositoryCommand)
/** Hands the message to the project capability, which authorizes and decides. */
export class SetProjectRepositoryHandler extends ICQRSHandler<SetProjectRepositoryCommand, ProjectRepositoryView> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly repositories: ProjectRepositoryService,
    ) {
        super(logger)
    }

    protected override process(command: SetProjectRepositoryCommand): Promise<ProjectRepositoryView> {
        return this.repositories.set({ learnerId: command.params.principal.id, ...command.params.request })
    }
}
