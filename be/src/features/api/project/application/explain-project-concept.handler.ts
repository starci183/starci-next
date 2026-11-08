import { CommandHandler } from "@nestjs/cqrs"
import { ProjectCodeReadService, type ConceptView } from "@modules/domain/project"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { ExplainProjectConceptCommand } from "./explain-project-concept.command"

@CommandHandler(ExplainProjectConceptCommand)
/** Hands the message to the project capability, which authorizes and decides. */
export class ExplainProjectConceptHandler extends ICQRSHandler<ExplainProjectConceptCommand, ConceptView> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly codeReads: ProjectCodeReadService,
    ) {
        super(logger)
    }

    protected override process(command: ExplainProjectConceptCommand): Promise<ConceptView> {
        return this.codeReads.read({ learnerId: command.params.principal.id, ...command.params.request })
    }
}
