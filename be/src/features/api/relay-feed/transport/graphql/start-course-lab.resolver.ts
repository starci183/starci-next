import { Args, Mutation, Resolver } from "@nestjs/graphql"
import type { CommandBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectCommandBus } from "@modules/platform/cqrs"
import { StartCourseLabCommand } from "../../application/start-course-lab.command"
import { StartCourseLabInput } from "./dto/course-lab.input"
import { CourseLabRequestedType } from "./dto/course-lab.type"

@Resolver()
/**
 * GraphQL door that asks the learner's online device to boot the lab: clone, compose up, seed and the first run, in the folder the
 * learner chose when `dir` is given. RELAY_DEVICE_OFFLINE with no device online.
 */
export class StartCourseLabResolver {
    constructor(@InjectCommandBus() private readonly commandBus: CommandBus) {}

    /** GraphQL door that asks the learner's online device to boot the lab, in the folder `dir` names when given. RELAY_DEVICE_OFFLINE with no device online. */
    @Mutation(() => CourseLabRequestedType, { name: "startCourseLab" })
    async startCourseLab(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: StartCourseLabInput,
    ): Promise<CourseLabRequestedType> {
        return this.commandBus.execute(
            new StartCourseLabCommand({
                request: {
                    courseId: input.courseId,
                    lessonId: input.lessonId,
                    ...(input.dir === undefined || input.dir === null ? {} : { dir: input.dir }),
                },
                principal: { id: identity.subject, role: "authenticated" },
            }),
        )
    }
}
