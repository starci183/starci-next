import { Args, Mutation, Resolver } from "@nestjs/graphql"
import type { CommandBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectCommandBus } from "@modules/platform/cqrs"
import { OpenCourseSolutionCommand } from "../../application/open-course-solution.command"
import { OpenCourseSolutionInput } from "./dto/course-lesson.input"
import { CourseSolutionOpenedType } from "./dto/course-hint.type"

@Resolver()
/** GraphQL door that records the learner opened the solution of a case ("Kẹt quá? Xem lời giải"). */
export class OpenCourseSolutionResolver {
    constructor(@InjectCommandBus() private readonly commandBus: CommandBus) {}

    /** Records the solution of an open case as opened, once; its before-and-after block is revealed from then on. */
    @Mutation(() => CourseSolutionOpenedType, {
        name: "openCourseSolution",
        description:
            "Records that the learner opened the solution of an open case, so courseLesson reveals its fix, after half and idea; idempotent. COURSE_CASE_LOCKED, COURSE_CASE_NOT_FOUND, COURSE_PREMIUM_REQUIRED.",
    })
    async openCourseSolution(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: OpenCourseSolutionInput,
    ): Promise<CourseSolutionOpenedType> {
        return this.commandBus.execute(
            new OpenCourseSolutionCommand({
                request: { lessonId: input.lessonId, caseId: input.caseId },
                principal: { id: identity.subject, role: "authenticated" },
            }),
        )
    }
}
