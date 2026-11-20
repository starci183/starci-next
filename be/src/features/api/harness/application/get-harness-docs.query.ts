import { Query } from "@nestjs/cqrs"
import type { HarnessDocSummaryView } from "@modules/domain/harness"
import type { GuestExecuteParams } from "@modules/platform/cqrs"
import type { HarnessLocaleRequest } from "./harness.contracts"

/** Asks for the docs of the harness. */
export class GetHarnessDocsQuery extends Query<ReadonlyArray<HarnessDocSummaryView>> {
    constructor(readonly params: GuestExecuteParams<HarnessLocaleRequest>) {
        super()
    }
}
