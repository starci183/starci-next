import { Args, Mutation, Resolver } from "@nestjs/graphql"
import type { CommandBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectCommandBus } from "@modules/platform/cqrs"
import { SubmitCourseLabCommand } from "../../application/submit-course-lab.command"
import { SubmitCourseLabInput } from "./dto/course-lab.input"
import { CourseLabSubmittedType } from "./dto/course-lab.type"

@Resolver()
/** GraphQL door that submits the lab for grading on the learner's own machine, against hidden tests it receives for one run. RELAY_DEVICE_OFFLINE with no device online. */
export class SubmitCourseLabResolver {
    constructor(@InjectCommandBus() private readonly commandBus: CommandBus) {}

    /** GraphQL door that submits the lab for grading on the learner's own machine, against hidden tests it receives for one run. RELAY_DEVICE_OFFLINE with no device online. */
    @Mutation(() => CourseLabSubmittedType, { name: "submitCourseLab" })
    async submitCourseLab(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: SubmitCourseLabInput,
    ): Promise<CourseLabSubmittedType> {
        return this.commandBus.execute(
            new SubmitCourseLabCommand({
                request: {
                    courseId: input.courseId,
                    lessonId: input.lessonId,
                    hintsOpened: input.hintsOpened,
                    timeSpentMs: input.timeSpentMs,
                    designDoc: input.designDoc,
                },
                principal: { id: identity.subject, role: "authenticated" },
            }),
        )
    }
}
