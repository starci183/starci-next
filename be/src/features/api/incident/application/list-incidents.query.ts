import { Query } from "@nestjs/cqrs"
import type { IncidentListItemView } from "@modules/domain/incident"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { ListIncidentsRequest } from "./list-incidents.contracts"

/** Asks for the incident list a signed-in learner may browse. */
export class ListIncidentsQuery extends Query<ReadonlyArray<IncidentListItemView>> {
    constructor(readonly params: ExecuteParams<ListIncidentsRequest>) {
        super()
    }
}
