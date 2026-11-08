import { QueryHandler } from "@nestjs/cqrs"
import { ProjectReadService, type ProjectCatalogView } from "@modules/domain/project"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { GetProjectCatalogQuery } from "./get-project-catalog.query"

@QueryHandler(GetProjectCatalogQuery)
/** Hands the message to the project capability, which authorizes and decides. */
export class GetProjectCatalogHandler extends ICQRSHandler<GetProjectCatalogQuery, ProjectCatalogView> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly reads: ProjectReadService,
    ) {
        super(logger)
    }

    protected override process(query: GetProjectCatalogQuery): Promise<ProjectCatalogView> {
        return this.reads.catalog({ locale: query.params.request.locale })
    }
}
