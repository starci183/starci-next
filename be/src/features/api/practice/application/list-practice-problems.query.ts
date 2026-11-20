import { Query } from "@nestjs/cqrs"
import type { PracticeProblemItemView } from "@modules/domain/practice"
import type { GuestExecuteParams } from "@modules/platform/cqrs"
import type { ListPracticeProblemsRequest } from "./list-practice-problems.contracts"

/** Asks for the problems of one pattern. */
export class ListPracticeProblemsQuery extends Query<ReadonlyArray<PracticeProblemItemView>> {
    constructor(readonly params: GuestExecuteParams<ListPracticeProblemsRequest>) {
        super()
    }
}
