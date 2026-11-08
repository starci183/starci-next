import { QueryHandler } from "@nestjs/cqrs"
import { ProjectRepositoryService, type ProjectRepositoryView } from "@modules/domain/project"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { GetProjectRepositoryQuery } from "./get-project-repository.query"

@QueryHandler(GetProjectRepositoryQuery)
/** Hands the message to the project capability, which authorizes and decides. */
export class GetProjectRepositoryHandler extends ICQRSHandler<GetProjectRepositoryQuery, ProjectRepositoryView> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly repositories: ProjectRepositoryService,
    ) {
        super(logger)
    }

    protected override process(query: GetProjectRepositoryQuery): Promise<ProjectRepositoryView> {
        return this.repositories.view(query.params.principal.id, query.params.request.projectId)
    }
}
