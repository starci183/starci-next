import { QueryHandler } from "@nestjs/cqrs"
import { ProjectReadService, type ProjectSummaryView } from "@modules/domain/project"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { ListProjectsQuery } from "./list-projects.query"

@QueryHandler(ListProjectsQuery)
/** Hands the message to the project capability, which authorizes and decides. */
export class ListProjectsHandler extends ICQRSHandler<ListProjectsQuery, ReadonlyArray<ProjectSummaryView>> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly reads: ProjectReadService,
    ) {
        super(logger)
    }

    protected override process(query: ListProjectsQuery): Promise<ReadonlyArray<ProjectSummaryView>> {
        return this.reads.list({ learnerId: query.params.principal.id, locale: query.params.request.locale })
    }
}
