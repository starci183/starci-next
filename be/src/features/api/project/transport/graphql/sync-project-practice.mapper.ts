import type { ProjectView } from "@modules/domain/project"
import { toPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { SyncProjectPracticeRequest } from "../../application/sync-project-practice.contracts"
import type { SyncProjectPracticeInput } from "./dto/sync-project-practice.input"
import type { ProjectDetailType } from "./dto/project-detail.type"

/** Maps the input and the session to the message params. */
export const toSyncProjectPracticeParams = (
    identity: IdentityPrincipal,
    input: SyncProjectPracticeInput,
): ExecuteParams<SyncProjectPracticeRequest> => ({
    request: { projectId: input.projectId, locale: input.locale },
    principal: toPrincipal(identity),
})

/** Maps the answer to its GraphQL type. */
export const toSyncProjectPracticeType = (view: ProjectView): ProjectDetailType => view
