import { Query } from "@nestjs/cqrs"
import type { HarnessGuideSummaryView } from "@modules/domain/harness"
import type { GuestExecuteParams } from "@modules/platform/cqrs"
import type { HarnessGuidesRequest } from "./harness.contracts"

/** Asks for the guides of one tool. */
export class GetHarnessGuidesQuery extends Query<ReadonlyArray<HarnessGuideSummaryView>> {
    constructor(readonly params: GuestExecuteParams<HarnessGuidesRequest>) {
        super()
    }
}
