import type { ProjectSecretView } from "@modules/domain/project"
import { toPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { CreateProjectRequest } from "../../application/create-project.contracts"
import type { CreateProjectInput } from "./dto/create-project.input"
import type { ProjectSecretType } from "./dto/project-secret.type"

/** Maps the input and the session to the message params. */
export const toCreateProjectParams = (
    identity: IdentityPrincipal,
    input: CreateProjectInput,
): ExecuteParams<CreateProjectRequest> => ({
    request: {
        name: input.name,
        kind: input.kind,
        topic: input.topic,
        language: input.language,
        stack: input.stack,
        track: input.track,
        repoUrl: input.repoUrl,
        locale: input.locale,
    },
    principal: toPrincipal(identity),
})

/** Maps the answer to its GraphQL type. */
export const toCreateProjectType = (view: ProjectSecretView): ProjectSecretType => view
