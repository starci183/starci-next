import { Query } from "@nestjs/cqrs"
import type { HarnessBuildView } from "@modules/domain/harness"
import type { GuestExecuteParams } from "@modules/platform/cqrs"
import type { HarnessBuildRequest } from "./harness.contracts"

/** Asks for one build with its stages, steps and e2e states. */
export class GetHarnessBuildQuery extends Query<HarnessBuildView> {
    constructor(readonly params: GuestExecuteParams<HarnessBuildRequest>) {
        super()
    }
}
