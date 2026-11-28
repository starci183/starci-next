import { Query, Resolver } from "@nestjs/graphql"
import type { QueryBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectQueryBus } from "@modules/platform/cqrs"
import { GetCoursesQuery } from "../../application/get-courses.query"
import { CourseCatalogType } from "./dto/course-catalog.type"

@Resolver()
/** GraphQL door of the course catalog for the signed-in learner; reading it is free. */
export class GetCoursesResolver {
    constructor(@InjectQueryBus() private readonly queryBus: QueryBus) {}

    /** Lists every course with its lessons, each marked available when a lab record of it is live. */
    @Query(() => [CourseCatalogType], {
        name: "courses",
        description:
            "The course catalog in the concept graph's teaching order: every course {courseId, title, summary, description, order, lessons[{lessonId, concept, conceptTerm, title, available}]}; free for every signed-in learner (the lab doors keep their Premium gate).",
    })
    async courses(@CurrentPrincipal() identity: IdentityPrincipal): Promise<ReadonlyArray<CourseCatalogType>> {
        return this.queryBus.execute(
            new GetCoursesQuery({ request: {}, principal: { id: identity.subject, role: "authenticated" } }),
        )
    }
}
