import { Query } from "@nestjs/cqrs"
import type { HarnessGuideView } from "@modules/domain/harness"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { HarnessGuideRequest } from "./harness.contracts"

/** Asks for one guide with its sections and probe results. */
export class GetHarnessGuideQuery extends Query<HarnessGuideView> {
    constructor(readonly params: ExecuteParams<HarnessGuideRequest>) {
        super()
    }
}
