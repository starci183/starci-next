import type { ProjectSecretView } from "@modules/domain/project"
import { toPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { RotateProjectCiSecretRequest } from "../../application/rotate-project-ci-secret.contracts"
import type { RotateProjectCiSecretInput } from "./dto/rotate-project-ci-secret.input"
import type { ProjectSecretType } from "./dto/project-secret.type"

/** Maps the input and the session to the message params. */
export const toRotateProjectCiSecretParams = (
    identity: IdentityPrincipal,
    input: RotateProjectCiSecretInput,
): ExecuteParams<RotateProjectCiSecretRequest> => ({
    request: { projectId: input.projectId, locale: input.locale },
    principal: toPrincipal(identity),
})

/** Maps the answer to its GraphQL type. */
export const toRotateProjectCiSecretType = (view: ProjectSecretView): ProjectSecretType => view
