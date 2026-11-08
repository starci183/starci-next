import { Args, Query, Resolver } from "@nestjs/graphql"
import type { QueryBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectQueryBus } from "@modules/platform/cqrs"
import { GetLessonTopicQuery } from "../../application/get-lesson-topic.query"
import { LessonTopicInput } from "./dto/lesson-topic.input"
import { LessonTopicType } from "./dto/lesson-topic.type"
import { toGetLessonTopicParams, toLessonTopicType } from "./get-lesson-topic.mapper"

@Resolver()
/** GraphQL door of one topic page; it needs a session and no Premium. */
export class LessonTopicResolver {
    constructor(@InjectQueryBus() private readonly queryBus: QueryBus) {}

    /** Reads the topic page: its path of lessons in the teacher's order. */
    @Query(() => LessonTopicType, { name: "lessonTopic" })
    async lessonTopic(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: LessonTopicInput,
    ): Promise<LessonTopicType> {
        const result = await this.queryBus.execute(new GetLessonTopicQuery(toGetLessonTopicParams(identity, input)))
        return toLessonTopicType(result)
    }
}
