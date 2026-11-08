import { Query } from "@nestjs/cqrs"
import type { PracticePatternView } from "@modules/domain/practice"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { ListPracticePatternsRequest } from "./list-practice-patterns.contracts"

/** Asks for the pattern list of the signed-in learner. */
export class ListPracticePatternsQuery extends Query<ReadonlyArray<PracticePatternView>> {
    constructor(readonly params: ExecuteParams<ListPracticePatternsRequest>) {
        super()
    }
}
