import { Query } from "@nestjs/cqrs"
import type { PathCatalogView } from "@modules/domain/path"
import type { GuestExecuteParams } from "@modules/platform/cqrs"
import type { OutcomePathsRequest } from "./outcome-paths.contracts"

/** Asks for the outcome paths and the one the learner follows (none for a guest). */
export class GetOutcomePathsQuery extends Query<PathCatalogView> {
    constructor(readonly params: GuestExecuteParams<OutcomePathsRequest>) {
        super()
    }
}
