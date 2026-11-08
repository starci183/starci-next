import type { DecisionResultView } from "@modules/domain/career"
import type { IdentityPrincipal } from "@modules/domain/identity"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { DecideExperienceRequest } from "../../application/decide-experience.contracts"
import type { DecideExperienceInput } from "./dto/decide-experience.input"
import type { DecisionResultType } from "./dto/decision-result.type"

/** Maps the input and the session to the message params. */
export const toDecideExperienceParams = (
    identity: IdentityPrincipal,
    input: DecideExperienceInput,
): ExecuteParams<DecideExperienceRequest> => ({
    request: {
        decisions: input.decisions.map((decision) => ({
            itemId: decision.itemId,
            verdict: decision.verdict,
            note: decision.note,
        })),
        roles: identity.roles,
    },
    principal: { id: identity.subject, role: "authenticated" },
})

/** Maps the answer to its GraphQL type. */
export const toDecideExperienceType = (view: ReadonlyArray<DecisionResultView>): Array<DecisionResultType> => [...view]
