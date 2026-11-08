import { CommandHandler } from "@nestjs/cqrs"
import { ProjectService, type ConceptView } from "@modules/domain/project"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { SetProjectConceptCommand } from "./set-project-concept.command"

@CommandHandler(SetProjectConceptCommand)
/** Hands the message to the project capability, which authorizes and decides. */
export class SetProjectConceptHandler extends ICQRSHandler<SetProjectConceptCommand, ConceptView> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly projects: ProjectService,
    ) {
        super(logger)
    }

    protected override process(command: SetProjectConceptCommand): Promise<ConceptView> {
        return this.projects.setConcept({ learnerId: command.params.principal.id, ...command.params.request })
    }
}
