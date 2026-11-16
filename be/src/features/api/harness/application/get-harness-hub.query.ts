import { Query } from "@nestjs/cqrs"
import type { HarnessHubView } from "@modules/domain/harness"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { HarnessLocaleRequest } from "./harness.contracts"

/** Asks for the hub of /harness: its three parts with the learner counts. */
export class GetHarnessHubQuery extends Query<HarnessHubView> {
    constructor(readonly params: ExecuteParams<HarnessLocaleRequest>) {
        super()
    }
}
