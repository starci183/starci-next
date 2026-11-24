import { Args, Mutation, Resolver } from "@nestjs/graphql"
import type { CommandBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectCommandBus } from "@modules/platform/cqrs"
import { StartCourseLabCommand } from "../../application/start-course-lab.command"
import { CourseLabInput } from "./dto/course-lab.input"
import { CourseLabRequestedType } from "./dto/course-lab.type"

@Resolver()
/** GraphQL door that asks the learner's online device to boot the lab: clone, compose up, seed and the first run. RELAY_DEVICE_OFFLINE with no device online. */
export class StartCourseLabResolver {
    constructor(@InjectCommandBus() private readonly commandBus: CommandBus) {}

    /** GraphQL door that asks the learner's online device to boot the lab: clone, compose up, seed and the first run. RELAY_DEVICE_OFFLINE with no device online. */
    @Mutation(() => CourseLabRequestedType, { name: "startCourseLab" })
    async startCourseLab(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: CourseLabInput,
    ): Promise<CourseLabRequestedType> {
        return this.commandBus.execute(
            new StartCourseLabCommand({
                request: { courseId: input.courseId, lessonId: input.lessonId },
                principal: { id: identity.subject, role: "authenticated" },
            }),
        )
    }
}
