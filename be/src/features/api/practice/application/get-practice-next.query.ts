import { Query } from "@nestjs/cqrs"
import type { PracticeNextView } from "@modules/domain/practice"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { GetPracticeNextRequest } from "./get-practice-next.contracts"

/** Asks where to go next in practice: the first problem not yet accepted and the problem to resume. */
export class GetPracticeNextQuery extends Query<PracticeNextView> {
    constructor(readonly params: ExecuteParams<GetPracticeNextRequest>) {
        super()
    }
}
