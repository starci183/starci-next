import { HarnessBuildBindingEntity } from "./entities/harness-build-binding.entity"
import { HarnessContentEntity } from "./entities/harness-content.entity"
import { HarnessStageProofEntity } from "./entities/harness-stage-proof.entity"
import { InitHarness1798400000000 } from "./migrations/1798400000000-init-harness"
import { HarnessRepoBinding1798500000000 } from "./migrations/1798500000000-harness-repo-binding"

/** The entities of the harness capability. */
export const harnessEntities: Array<
    typeof HarnessContentEntity | typeof HarnessBuildBindingEntity | typeof HarnessStageProofEntity
> = [HarnessContentEntity, HarnessBuildBindingEntity, HarnessStageProofEntity]

/** The migrations of the harness capability, in the order they run. */
export const harnessMigrations: Array<typeof InitHarness1798400000000 | typeof HarnessRepoBinding1798500000000> = [
    InitHarness1798400000000,
    HarnessRepoBinding1798500000000,
]
