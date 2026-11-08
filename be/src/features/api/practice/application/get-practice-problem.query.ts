import { Query } from "@nestjs/cqrs"
import type { PracticeProblemView } from "@modules/domain/practice"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { GetPracticeProblemRequest } from "./get-practice-problem.contracts"

/** Asks for one problem to open. */
export class GetPracticeProblemQuery extends Query<PracticeProblemView> {
    constructor(readonly params: ExecuteParams<GetPracticeProblemRequest>) {
        super()
    }
}
