import { Args, Mutation, Resolver } from "@nestjs/graphql"
import type { CommandBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectCommandBus } from "@modules/platform/cqrs"
import { OpenCourseHintCommand } from "../../application/open-course-hint.command"
import { OpenCourseHintInput } from "./dto/course-lesson.input"
import { CourseHintOpenedType } from "./dto/course-hint.type"

@Resolver()
/** GraphQL door that opens one hint level of a case for the signed-in learner. */
export class OpenCourseHintResolver {
    constructor(@InjectCommandBus() private readonly commandBus: CommandBus) {}

    /** Opens hint `level` of a case, one level at a time on an open case, and answers its text. */
    @Mutation(() => CourseHintOpenedType, {
        name: "openCourseHint",
        description:
            "Opens one hint level (1 to 3) of a case: only after the level below, only on an open case. COURSE_HINT_OUT_OF_ORDER, COURSE_CASE_LOCKED, COURSE_CASE_NOT_FOUND, COURSE_HINT_NOT_FOUND, COURSE_PREMIUM_REQUIRED.",
    })
    async openCourseHint(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: OpenCourseHintInput,
    ): Promise<CourseHintOpenedType> {
        return this.commandBus.execute(
            new OpenCourseHintCommand({
                request: { lessonId: input.lessonId, caseId: input.caseId, level: input.level, locale: input.locale },
                principal: { id: identity.subject, role: "authenticated" },
            }),
        )
    }
}
