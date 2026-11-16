import type { CvPreviewView } from "@modules/domain/project"
import { toPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { GetProjectCvPreviewRequest } from "../../application/get-project-cv-preview.contracts"
import type { ProjectCvPreviewInput } from "./dto/project-cv-preview.input"
import type { ProjectCvPreviewType } from "./dto/project-cv-preview.type"

/** Maps the input and the session to the message params. */
export const toGetProjectCvPreviewParams = (
    identity: IdentityPrincipal,
    input: ProjectCvPreviewInput,
): ExecuteParams<GetProjectCvPreviewRequest> => ({
    request: {
        projectId: input.projectId,
        conceptId: input.conceptId ?? null,
        milestoneId: input.milestoneId ?? null,
        locale: input.locale,
    },
    principal: toPrincipal(identity),
})

/** Maps the answer to its GraphQL type. */
export const toGetProjectCvPreviewType = (view: CvPreviewView): ProjectCvPreviewType => view
