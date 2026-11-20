import { ProjectEntity } from "./project.entity"
import { ProjectConceptEntity } from "./project-concept.entity"
import { ProjectEvidenceEntity } from "./project-evidence.entity"
import { ProjectCiRunEntity } from "./project-ci-run.entity"
import { ProjectProbeRunEntity } from "./project-probe-run.entity"
import { ProjectProofEntity } from "./project-proof.entity"
import { ProjectCheckDocumentEntity } from "./project-check-document.entity"

export {
    ProjectCheckDocumentEntity,
    ProjectCiRunEntity,
    ProjectConceptEntity,
    ProjectEntity,
    ProjectEvidenceEntity,
    ProjectProbeRunEntity,
    ProjectProofEntity,
}

/** The entities of the project capability, named in PRIMARY_ENTITIES of platform/database/entities.ts. */
export const projectEntities: ReadonlyArray<new () => object> = [
    ProjectEntity,
    ProjectConceptEntity,
    ProjectEvidenceEntity,
    ProjectCiRunEntity,
    ProjectProbeRunEntity,
    ProjectProofEntity,
    ProjectCheckDocumentEntity,
]
