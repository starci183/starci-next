import { Args, Query, Resolver } from "@nestjs/graphql"
import type { QueryBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectQueryBus } from "@modules/platform/cqrs"
import { GetLessonChallengeScoresQuery } from "../../application/get-lesson-challenge-scores.query"
import { LessonChallengeScoreType } from "./dto/lesson-challenge-score.type"
import { LessonChallengeScoresInput } from "./dto/lesson-challenge-scores.input"

@Resolver()
/** GraphQL door of the rubric score of every rung of a lesson's ladder; Tự áp dụng needs Premium. */
export class LessonChallengeScoresResolver {
    constructor(@InjectQueryBus() private readonly queryBus: QueryBus) {}

    /** Reads, per rung, the score out of 100, each criterion's points and whether the rung is locked, passed and opens the next. */
    @Query(() => [LessonChallengeScoreType], { name: "lessonChallengeScores" })
    async lessonChallengeScores(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: LessonChallengeScoresInput,
    ): Promise<ReadonlyArray<LessonChallengeScoreType>> {
        return this.queryBus.execute(
            new GetLessonChallengeScoresQuery({
                request: { lessonId: input.lessonId },
                principal: { id: identity.subject, role: "authenticated" },
            }),
        )
    }
}
