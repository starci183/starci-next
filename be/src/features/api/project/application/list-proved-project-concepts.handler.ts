import { QueryHandler } from "@nestjs/cqrs"
import { ProjectReadService, type ProvedConceptView } from "@modules/domain/project"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { ListProvedProjectConceptsQuery } from "./list-proved-project-concepts.query"

@QueryHandler(ListProvedProjectConceptsQuery)
/** Hands the message to the project capability, which authorizes and decides. */
export class ListProvedProjectConceptsHandler extends ICQRSHandler<
    ListProvedProjectConceptsQuery,
    ReadonlyArray<ProvedConceptView>
> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly reads: ProjectReadService,
    ) {
        super(logger)
    }

    protected override process(query: ListProvedProjectConceptsQuery): Promise<ReadonlyArray<ProvedConceptView>> {
        return this.reads.provedConcepts(query.params.principal.id)
    }
}
