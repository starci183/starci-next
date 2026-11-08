import { Query } from "@nestjs/cqrs"
import type { ReviewerView } from "@modules/domain/career"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { GetExperienceReviewersRequest } from "./get-experience-reviewers.contracts"

/** Lists the active reviewer appointments for the teacher. */
export class GetExperienceReviewersQuery extends Query<ReadonlyArray<ReviewerView>> {
    constructor(readonly params: ExecuteParams<GetExperienceReviewersRequest>) {
        super()
    }
}
