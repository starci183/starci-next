import { Args, Query, Resolver } from "@nestjs/graphql"
import type { QueryBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectQueryBus } from "@modules/platform/cqrs"
import { GetCourseLessonQuery } from "../../application/get-course-lesson.query"
import { CourseLessonInput } from "./dto/course-lesson.input"
import { CourseLessonType } from "./dto/course-lesson.type"

@Resolver()
/** GraphQL door of the lab of one lesson for the signed-in learner; Premium beyond the free part. */
export class GetCourseLessonResolver {
    constructor(@InjectQueryBus() private readonly queryBus: QueryBus) {}

    /** Reads the lab@2 record: hint texts only for the levels the learner opened, no grader beyond the dimensions of its matrix. */
    @Query(() => CourseLessonType, {
        name: "courseLesson",
        description:
            "The lab of a lesson: stack, invariants, happy and unhappy cases with hints [{level, text, unlocked}] (text only for opened levels) and the dimensions of the grading matrix. COURSE_LESSON_NOT_FOUND, COURSE_PREMIUM_REQUIRED.",
    })
    async courseLesson(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: CourseLessonInput,
    ): Promise<CourseLessonType> {
        return this.queryBus.execute(
            new GetCourseLessonQuery({
                request: { lessonId: input.lessonId, locale: input.locale },
                principal: { id: identity.subject, role: "authenticated" },
            }),
        )
    }
}
