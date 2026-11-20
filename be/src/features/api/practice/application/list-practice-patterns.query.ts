import { Query } from "@nestjs/cqrs"
import type { PracticePatternView } from "@modules/domain/practice"
import type { GuestExecuteParams } from "@modules/platform/cqrs"
import type { ListPracticePatternsRequest } from "./list-practice-patterns.contracts"

/** Asks for the pattern list of the signed-in learner. */
export class ListPracticePatternsQuery extends Query<ReadonlyArray<PracticePatternView>> {
    constructor(readonly params: GuestExecuteParams<ListPracticePatternsRequest>) {
        super()
    }
}
