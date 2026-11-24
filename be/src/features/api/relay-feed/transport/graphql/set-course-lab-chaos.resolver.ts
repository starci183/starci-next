import { Args, Mutation, Resolver } from "@nestjs/graphql"
import type { CommandBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectCommandBus } from "@modules/platform/cqrs"
import { SetCourseLabChaosCommand } from "../../application/set-course-lab-chaos.command"
import { SetCourseLabChaosInput } from "./dto/course-lab.input"
import { CourseLabRequestedType } from "./dto/course-lab.type"

@Resolver()
/** GraphQL door that asks the learner's online device to turn exactly these chaos switches on and run the tests. RELAY_DEVICE_OFFLINE with no device online. */
export class SetCourseLabChaosResolver {
    constructor(@InjectCommandBus() private readonly commandBus: CommandBus) {}

    /** GraphQL door that asks the learner's online device to turn exactly these chaos switches on and run the tests. RELAY_DEVICE_OFFLINE with no device online. */
    @Mutation(() => CourseLabRequestedType, { name: "setCourseLabChaos" })
    async setCourseLabChaos(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: SetCourseLabChaosInput,
    ): Promise<CourseLabRequestedType> {
        return this.commandBus.execute(
            new SetCourseLabChaosCommand({
                request: { courseId: input.courseId, lessonId: input.lessonId, chaosIds: input.chaosIds },
                principal: { id: identity.subject, role: "authenticated" },
            }),
        )
    }
}
