import { Query } from "@nestjs/cqrs"
import type { ChallengeScore } from "@modules/domain/relay"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { GetLessonChallengeScoresRequest } from "./get-lesson-challenge-scores.contracts"

/** Asks for the score of every rung of one lesson's challenge ladder for the signed-in learner. */
export class GetLessonChallengeScoresQuery extends Query<ReadonlyArray<ChallengeScore>> {
    constructor(readonly params: ExecuteParams<GetLessonChallengeScoresRequest>) {
        super()
    }
}
