import { Args, Query, Resolver } from "@nestjs/graphql"
import type { QueryBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectQueryBus } from "@modules/platform/cqrs"
import { GetLessonAttemptQuery } from "../../application/get-lesson-attempt.query"
import { LessonAttemptInput } from "./dto/lesson-attempt.input"
import { LessonAttemptType } from "./dto/lesson-attempt.type"
import { toGetLessonAttemptParams, toLessonAttemptType } from "./get-lesson-attempt.mapper"

@Resolver()
/** GraphQL door of one attempt of the learner; it needs a session and shows no attempt of another learner. */
export class LessonAttemptResolver {
    constructor(@InjectQueryBus() private readonly queryBus: QueryBus) {}

    /** Reads an attempt with its status and, once graded, its result. */
    @Query(() => LessonAttemptType, { name: "lessonAttempt" })
    async lessonAttempt(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: LessonAttemptInput,
    ): Promise<LessonAttemptType> {
        const result = await this.queryBus.execute(new GetLessonAttemptQuery(toGetLessonAttemptParams(identity, input)))
        return toLessonAttemptType(result)
    }
}
