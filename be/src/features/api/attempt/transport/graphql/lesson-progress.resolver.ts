import { Args, Query, Resolver } from "@nestjs/graphql"
import type { QueryBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectQueryBus } from "@modules/platform/cqrs"
import { GetLessonProgressQuery } from "../../application/get-lesson-progress.query"
import { LessonProgressInput } from "./dto/lesson-progress.input"
import { LessonProgressType } from "./dto/lesson-progress.type"
import { toGetLessonProgressParams, toLessonProgressType } from "./get-lesson-progress.mapper"

@Resolver()
/** GraphQL door of the progress of the learner in one lesson; it needs a session and no Premium. */
export class LessonProgressResolver {
    constructor(@InjectQueryBus() private readonly queryBus: QueryBus) {}

    /** Reads the furthest phase, the outcome levels and the attempts of the learner in a lesson. */
    @Query(() => LessonProgressType, { name: "lessonProgress" })
    async lessonProgress(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: LessonProgressInput,
    ): Promise<LessonProgressType> {
        const result = await this.queryBus.execute(
            new GetLessonProgressQuery(toGetLessonProgressParams(identity, input)),
        )
        return toLessonProgressType(result)
    }
}
