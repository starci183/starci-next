import { Args, Query, Resolver } from "@nestjs/graphql"
import type { QueryBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectQueryBus } from "@modules/platform/cqrs"
import { GetCourseLabQuery } from "../../application/get-course-lab.query"
import { CourseLabInput } from "./dto/course-lab.input"
import { CourseLabType } from "./dto/course-lab.type"

@Resolver()
/** GraphQL door of the lab of one lesson for the signed-in learner (a session, not a device token); Premium beyond the free part. The page re-reads it while the lab boots or a run is in flight. */
export class GetCourseLabResolver {
    constructor(@InjectQueryBus() private readonly queryBus: QueryBus) {}

    /** GraphQL door of the lab of one lesson for the signed-in learner (a session, not a device token); Premium beyond the free part. The page re-reads it while the lab boots or a run is in flight. */
    @Query(() => CourseLabType, { name: "courseLab" })
    async courseLab(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: CourseLabInput,
    ): Promise<CourseLabType> {
        return this.queryBus.execute(
            new GetCourseLabQuery({
                request: { courseId: input.courseId, lessonId: input.lessonId },
                principal: { id: identity.subject, role: "authenticated" },
            }),
        )
    }
}
