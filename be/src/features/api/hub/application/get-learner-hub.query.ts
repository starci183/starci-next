import { Query } from "@nestjs/cqrs"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { LearnerHubView } from "@modules/domain/hub"
import type { GetLearnerHubRequest } from "./get-learner-hub.contracts"

/** Asks for the hub of the signed-in learner. */
export class GetLearnerHubQuery extends Query<LearnerHubView> {
    constructor(readonly params: ExecuteParams<GetLearnerHubRequest>) {
        super()
    }
}
