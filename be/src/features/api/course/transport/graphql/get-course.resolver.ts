import { Args, Query, Resolver } from "@nestjs/graphql"
import type { QueryBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectQueryBus } from "@modules/platform/cqrs"
import { GetCourseQuery } from "../../application/get-course.query"
import { CourseCatalogInput } from "./dto/course-catalog.input"
import { CourseCatalogDetailType } from "./dto/course-catalog.type"

@Resolver()
/** GraphQL door of one course of the catalog for the signed-in learner; reading it is free. */
export class GetCourseResolver {
    constructor(@InjectQueryBus() private readonly queryBus: QueryBus) {}

    /** Reads one course with its lessons and the system map of its intro. */
    @Query(() => CourseCatalogDetailType, {
        name: "course",
        description:
            "One course of the catalog: the fields of `courses` plus system {nodes[{id, service, label, role}], edges[{from, to}]} for the intro map; free for every signed-in learner. COURSE_NOT_FOUND.",
    })
    async course(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: CourseCatalogInput,
    ): Promise<CourseCatalogDetailType> {
        return this.queryBus.execute(
            new GetCourseQuery({
                request: { courseId: input.courseId },
                principal: { id: identity.subject, role: "authenticated" },
            }),
        )
    }
}
