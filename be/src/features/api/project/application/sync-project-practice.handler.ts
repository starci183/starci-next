import { CommandHandler } from "@nestjs/cqrs"
import { ProjectPracticeService, type ProjectView } from "@modules/domain/project"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { SyncProjectPracticeCommand } from "./sync-project-practice.command"

@CommandHandler(SyncProjectPracticeCommand)
/** Hands the message to the project capability, which authorizes and decides. */
export class SyncProjectPracticeHandler extends ICQRSHandler<SyncProjectPracticeCommand, ProjectView> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly practice: ProjectPracticeService,
    ) {
        super(logger)
    }

    protected override process(command: SyncProjectPracticeCommand): Promise<ProjectView> {
        return this.practice.sync({ learnerId: command.params.principal.id, ...command.params.request })
    }
}
