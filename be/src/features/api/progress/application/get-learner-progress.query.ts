import { Query } from "@nestjs/cqrs"
import type { LearnerProgressView } from "@modules/domain/progress"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { GetLearnerProgressRequest } from "./get-learner-progress.contracts"

/** Asks for the progress page of the signed-in learner. */
export class GetLearnerProgressQuery extends Query<LearnerProgressView> {
    constructor(readonly params: ExecuteParams<GetLearnerProgressRequest>) {
        super()
    }
}
