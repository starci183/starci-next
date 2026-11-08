import { Query } from "@nestjs/cqrs"
import type { PathCatalogView } from "@modules/domain/path"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { OutcomePathsRequest } from "./outcome-paths.contracts"

/** Asks for the outcome paths and the one the signed-in learner follows. */
export class GetOutcomePathsQuery extends Query<PathCatalogView> {
    constructor(readonly params: ExecuteParams<OutcomePathsRequest>) {
        super()
    }
}
