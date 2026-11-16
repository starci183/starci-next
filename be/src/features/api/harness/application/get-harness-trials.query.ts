import { Query } from "@nestjs/cqrs"
import type { HarnessTrapView } from "@modules/domain/harness"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { HarnessTrialsRequest } from "./harness.contracts"

/** Asks for the trial traps with the newest result of each. */
export class GetHarnessTrialsQuery extends Query<ReadonlyArray<HarnessTrapView>> {
    constructor(readonly params: ExecuteParams<HarnessTrialsRequest>) {
        super()
    }
}
