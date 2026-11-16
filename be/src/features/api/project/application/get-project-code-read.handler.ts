import { QueryHandler } from "@nestjs/cqrs"
import { ProjectExtrasService, type CodeReadView } from "@modules/domain/project"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { GetProjectCodeReadQuery } from "./get-project-code-read.query"

@QueryHandler(GetProjectCodeReadQuery)
/** Hands the message to the project capability, which authorizes and decides. */
export class GetProjectCodeReadHandler extends ICQRSHandler<GetProjectCodeReadQuery, CodeReadView | null> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly extras: ProjectExtrasService,
    ) {
        super(logger)
    }

    protected override process(query: GetProjectCodeReadQuery): Promise<CodeReadView | null> {
        return this.extras.codeRead({ learnerId: query.params.principal.id, ...query.params.request })
    }
}
