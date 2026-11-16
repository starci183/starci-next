import { Args, Query, Resolver } from "@nestjs/graphql"
import type { QueryBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectQueryBus } from "@modules/platform/cqrs"
import { GetLessonOpenerScoresQuery } from "../../application/get-lesson-opener-scores.query"
import { LessonOpenerScoresInput } from "./dto/lesson-opener-scores.input"
import { LessonOpenerScoreType } from "./dto/lesson-opener-score.type"
import { toGetLessonOpenerScoresParams, toLessonOpenerScoreTypes } from "./get-lesson-opener-scores.mapper"

@Resolver()
/** GraphQL door of the five-question opener scores; it needs a session and no Premium (the opener is free). */
export class LessonOpenerScoresResolver {
    constructor(@InjectQueryBus() private readonly queryBus: QueryBus) {}

    /** Reads, per lesson, how many opener questions the learner got right the first time and right now. */
    @Query(() => [LessonOpenerScoreType], { name: "lessonOpenerScores" })
    async lessonOpenerScores(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: LessonOpenerScoresInput,
    ): Promise<ReadonlyArray<LessonOpenerScoreType>> {
        const result = await this.queryBus.execute(
            new GetLessonOpenerScoresQuery(toGetLessonOpenerScoresParams(identity, input)),
        )
        return toLessonOpenerScoreTypes(result)
    }
}
