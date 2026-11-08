import { QueryHandler } from "@nestjs/cqrs"
import { IncidentReadService, type IncidentListItemView } from "@modules/domain/incident"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { ListIncidentsQuery } from "./list-incidents.query"

@QueryHandler(ListIncidentsQuery)
/** Answers the incident list the incident capability owns. */
export class ListIncidentsHandler extends ICQRSHandler<ListIncidentsQuery, ReadonlyArray<IncidentListItemView>> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly incidents: IncidentReadService,
    ) {
        super(logger)
    }

    protected override process(query: ListIncidentsQuery): Promise<ReadonlyArray<IncidentListItemView>> {
        return this.incidents.list({ locale: query.params.request.locale, topic: query.params.request.topic })
    }
}
