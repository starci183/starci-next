import { toPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import type { IncidentListItemView } from "@modules/domain/incident"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { ListIncidentsRequest } from "../../application/list-incidents.contracts"
import type { IncidentListItemType } from "./dto/incident-list-item.type"
import type { IncidentsInput } from "./dto/incidents.input"

/** Maps the incident list input and the session to the message params. */
export const toListIncidentsParams = (
    identity: IdentityPrincipal,
    input: IncidentsInput,
): ExecuteParams<ListIncidentsRequest> => ({
    request: { locale: input.locale, topic: input.topic },
    principal: toPrincipal(identity),
})

/** Maps the incident rows to their GraphQL type; the schema lists every field a learner may read. */
export const toIncidentListItemTypes = (result: ReadonlyArray<IncidentListItemView>): Array<IncidentListItemType> => [
    ...result,
]
