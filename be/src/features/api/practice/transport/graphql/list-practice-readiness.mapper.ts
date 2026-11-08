import { toPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { ListPracticeReadinessRequest } from "../../application/list-practice-readiness.contracts"
import type { PracticeReadinessInput } from "./dto/practice-readiness.input"

/** Maps the readiness per pattern input and the session to the message params. */
export const toListPracticeReadinessParams = (
    identity: IdentityPrincipal,
    input: PracticeReadinessInput,
): ExecuteParams<ListPracticeReadinessRequest> => ({
    request: { locale: input.locale },
    principal: toPrincipal(identity),
})
