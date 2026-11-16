import { Query } from "@nestjs/cqrs"
import type { OpenerScoreView } from "@modules/domain/attempt"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { GetLessonOpenerScoresRequest } from "./get-lesson-opener-scores.contracts"

/** Asks for the five-question opener scores of the signed-in learner in some lessons. */
export class GetLessonOpenerScoresQuery extends Query<ReadonlyArray<OpenerScoreView>> {
    constructor(readonly params: ExecuteParams<GetLessonOpenerScoresRequest>) {
        super()
    }
}
