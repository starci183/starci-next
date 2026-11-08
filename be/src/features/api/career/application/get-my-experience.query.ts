import { Query } from "@nestjs/cqrs"
import type { MyExperienceView } from "@modules/domain/career"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { GetMyExperienceRequest } from "./get-my-experience.contracts"

/** Lists the experience items of the signed-in learner. */
export class GetMyExperienceQuery extends Query<MyExperienceView> {
    constructor(readonly params: ExecuteParams<GetMyExperienceRequest>) {
        super()
    }
}
