import { ProjectCiRunEntity } from "./entities/project-ci-run.entity"
import { ProjectConceptEntity } from "./entities/project-concept.entity"
import { ProjectEntity } from "./entities/project.entity"
import { ProjectEvidenceEntity } from "./entities/project-evidence.entity"
import { ProjectProbeRunEntity } from "./entities/project-probe-run.entity"
import { ProjectProofEntity } from "./entities/project-proof.entity"
import { InitProject1797650000000 } from "./migrations/1797650000000-init-project"
import { DropProjectSample1797650000002 } from "./migrations/1797650000002-drop-project-sample"
import { ProjectCiAttestation1798000000000 } from "./migrations/1798000000000-project-ci-attestation"

/** The entities of the project capability. */
export const projectEntities: Array<
    | typeof ProjectEntity
    | typeof ProjectConceptEntity
    | typeof ProjectEvidenceEntity
    | typeof ProjectCiRunEntity
    | typeof ProjectProbeRunEntity
    | typeof ProjectProofEntity
> = [
    ProjectEntity,
    ProjectConceptEntity,
    ProjectEvidenceEntity,
    ProjectCiRunEntity,
    ProjectProbeRunEntity,
    ProjectProofEntity,
]

/** The migrations of the project capability, in the order they run. */
export const projectMigrations: Array<
    typeof InitProject1797650000000 | typeof DropProjectSample1797650000002 | typeof ProjectCiAttestation1798000000000
> = [InitProject1797650000000, DropProjectSample1797650000002, ProjectCiAttestation1798000000000]
