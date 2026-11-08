import { QueryHandler } from "@nestjs/cqrs"
import { PathService, type PathCatalogView } from "@modules/domain/path"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { GetOutcomePathsQuery } from "./get-outcome-paths.query"

@QueryHandler(GetOutcomePathsQuery)
/** Hands the catalog of outcome paths and the choice of the learner from the path capability. */
export class GetOutcomePathsHandler extends ICQRSHandler<GetOutcomePathsQuery, PathCatalogView> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly paths: PathService,
    ) {
        super(logger)
    }

    protected override process(query: GetOutcomePathsQuery): Promise<PathCatalogView> {
        return this.paths.catalog(query.params.principal.id, query.params.request.locale)
    }
}
