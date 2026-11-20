import { Query } from "@nestjs/cqrs"
import type { HarnessBuildSummaryView } from "@modules/domain/harness"
import type { GuestExecuteParams } from "@modules/platform/cqrs"
import type { HarnessLocaleRequest } from "./harness.contracts"

/** Asks for the builds with the progress of each. */
export class GetHarnessBuildsQuery extends Query<ReadonlyArray<HarnessBuildSummaryView>> {
    constructor(readonly params: GuestExecuteParams<HarnessLocaleRequest>) {
        super()
    }
}
