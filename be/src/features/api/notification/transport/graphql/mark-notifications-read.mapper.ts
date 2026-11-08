import { toPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { MarkNotificationsReadRequest } from "../../application/mark-notifications-read.contracts"
import type { MarkNotificationsReadInput } from "./dto/mark-notifications-read.input"

/** Maps the GraphQL input and the session to the command params. */
export const toMarkNotificationsReadParams = (
    identity: IdentityPrincipal,
    input: MarkNotificationsReadInput,
): ExecuteParams<MarkNotificationsReadRequest> => ({
    request: { ids: input.ids, all: input.all },
    principal: toPrincipal(identity),
})
