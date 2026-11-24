import { Args, Mutation, Resolver } from "@nestjs/graphql"
import type { CommandBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectCommandBus } from "@modules/platform/cqrs"
import { RunCourseLabTestsCommand } from "../../application/run-course-lab-tests.command"
import { CourseLabInput } from "./dto/course-lab.input"
import { CourseLabRequestedType } from "./dto/course-lab.type"

@Resolver()
/** GraphQL door that asks the learner's online device to run the visible tests of the lab. RELAY_DEVICE_OFFLINE with no device online. */
export class RunCourseLabTestsResolver {
    constructor(@InjectCommandBus() private readonly commandBus: CommandBus) {}

    /** GraphQL door that asks the learner's online device to run the visible tests of the lab. RELAY_DEVICE_OFFLINE with no device online. */
    @Mutation(() => CourseLabRequestedType, { name: "runCourseLabTests" })
    async runCourseLabTests(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: CourseLabInput,
    ): Promise<CourseLabRequestedType> {
        return this.commandBus.execute(
            new RunCourseLabTestsCommand({
                request: { courseId: input.courseId, lessonId: input.lessonId },
                principal: { id: identity.subject, role: "authenticated" },
            }),
        )
    }
}
