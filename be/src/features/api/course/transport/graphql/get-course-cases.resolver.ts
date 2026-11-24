import { Args, Query, Resolver } from "@nestjs/graphql"
import type { QueryBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectQueryBus } from "@modules/platform/cqrs"
import { GetCourseCasesQuery } from "../../application/get-course-cases.query"
import { CourseCasesInput } from "./dto/course-lesson.input"
import { CourseCasesType } from "./dto/course-cases.type"

@Resolver()
/** GraphQL door of the learner's cases of one lab; Premium beyond the free part. */
export class GetCourseCasesResolver {
    constructor(@InjectQueryBus() private readonly queryBus: QueryBus) {}

    /** Reads every case in order with its status, hints, diff and reset, and the case to work on now. Graded on the learner's machine: practice, never proof. */
    @Query(() => CourseCasesType, {
        name: "courseCases",
        description:
            "Every case of a lab in order (happy, then unhappy) with status locked|open|red|green|error, everGreen, hintsOpened, diffAvailable, resetAvailable and the last run; currentCaseId is the first open case never green. COURSE_LESSON_NOT_FOUND, COURSE_PREMIUM_REQUIRED.",
    })
    async courseCases(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: CourseCasesInput,
    ): Promise<CourseCasesType> {
        return this.queryBus.execute(
            new GetCourseCasesQuery({
                request: { lessonId: input.lessonId },
                principal: { id: identity.subject, role: "authenticated" },
            }),
        )
    }
}
