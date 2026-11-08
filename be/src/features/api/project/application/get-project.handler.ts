import { QueryHandler } from "@nestjs/cqrs"
import { ProjectReadService, type ProjectView } from "@modules/domain/project"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { GetProjectQuery } from "./get-project.query"

@QueryHandler(GetProjectQuery)
/** Hands the message to the project capability, which authorizes and decides. */
export class GetProjectHandler extends ICQRSHandler<GetProjectQuery, ProjectView> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly reads: ProjectReadService,
    ) {
        super(logger)
    }

    protected override process(query: GetProjectQuery): Promise<ProjectView> {
        return this.reads.get({ learnerId: query.params.principal.id, ...query.params.request })
    }
}
