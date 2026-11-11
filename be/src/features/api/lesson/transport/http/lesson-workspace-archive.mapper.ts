import type { IdentityPrincipal } from "@modules/domain/identity"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { GetLessonWorkspaceArchiveRequest } from "../../application/get-lesson-workspace-archive.contracts"

/** Maps the download request and the session to the message params. */
export const toGetLessonWorkspaceArchiveParams = (
    identity: IdentityPrincipal,
    id: string,
    language: string,
): ExecuteParams<GetLessonWorkspaceArchiveRequest> => ({
    request: { id, language },
    principal: { id: identity.subject, role: "authenticated" },
})
