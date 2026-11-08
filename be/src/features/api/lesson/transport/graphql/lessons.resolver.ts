import { Args, Query, Resolver } from "@nestjs/graphql"
import type { QueryBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectQueryBus } from "@modules/platform/cqrs"
import { ListLessonsQuery } from "../../application/list-lessons.query"
import { LessonCatalogItemType } from "./dto/lesson-catalog-item.type"
import { LessonsInput } from "./dto/lessons.input"
import { toListLessonsParams, toLessonCatalogItemTypes } from "./list-lessons.mapper"

@Resolver()
/** GraphQL door of the lesson catalog; it needs a session and no Premium. */
export class LessonsResolver {
    constructor(@InjectQueryBus() private readonly queryBus: QueryBus) {}

    /** Lists the live lessons, titled in the asked locale. */
    @Query(() => [LessonCatalogItemType], { name: "lessons" })
    async lessons(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: LessonsInput,
    ): Promise<Array<LessonCatalogItemType>> {
        const result = await this.queryBus.execute(new ListLessonsQuery(toListLessonsParams(identity, input)))
        return toLessonCatalogItemTypes(result)
    }
}
