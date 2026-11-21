import { HarnessBuildBindingEntity } from "./harness-build-binding.entity"
import { HarnessContentEntity } from "./harness-content.entity"
import { HarnessStageProofEntity } from "./harness-stage-proof.entity"

export { HarnessBuildBindingEntity, HarnessContentEntity, HarnessStageProofEntity }

/** The entities of the harness capability, named in PRIMARY_ENTITIES of platform/database/entities.ts. */
export const harnessEntities: ReadonlyArray<new () => object> = [
    HarnessContentEntity,
    HarnessBuildBindingEntity,
    HarnessStageProofEntity,
]
