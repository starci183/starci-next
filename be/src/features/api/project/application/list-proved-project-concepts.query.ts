import { Query } from "@nestjs/cqrs"
import type { ProvedConceptView } from "@modules/domain/project"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { ListProvedProjectConceptsRequest } from "./list-proved-project-concepts.contracts"

/** Lists the concepts the signed-in learner proved in any project. */
export class ListProvedProjectConceptsQuery extends Query<ReadonlyArray<ProvedConceptView>> {
    constructor(readonly params: ExecuteParams<ListProvedProjectConceptsRequest>) {
        super()
    }
}
