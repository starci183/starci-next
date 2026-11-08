import { Args, Query, Resolver } from "@nestjs/graphql"
import type { QueryBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectQueryBus } from "@modules/platform/cqrs"
import { GetLessonQuery } from "../../application/get-lesson.query"
import { LessonInput } from "./dto/lesson.input"
import { LessonType } from "./dto/lesson.type"
import { toGetLessonParams, toLessonType } from "./get-lesson.mapper"

@Resolver()
/** GraphQL door of one lesson; it needs a session, and Premium only for the phases beyond the free one. */
export class LessonResolver {
    constructor(@InjectQueryBus() private readonly queryBus: QueryBus) {}

    /** Reads the public projection of one live lesson; a locked phase keeps only its title without Premium. */
    @Query(() => LessonType, { name: "lesson" })
    async lesson(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: LessonInput,
    ): Promise<LessonType> {
        const result = await this.queryBus.execute(new GetLessonQuery(toGetLessonParams(identity, input)))
        return toLessonType(result)
    }
}
