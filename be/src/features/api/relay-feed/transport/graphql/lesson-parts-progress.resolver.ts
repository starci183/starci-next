import { Args, Query, Resolver } from "@nestjs/graphql"
import type { QueryBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectQueryBus } from "@modules/platform/cqrs"
import { GetLessonPartsProgressQuery } from "../../application/get-lesson-parts-progress.query"
import { LessonPartsProgressInput } from "./dto/lesson-parts-progress.input"
import { LessonPartsProgressType } from "./dto/lesson-parts-progress.type"

@Resolver()
/** GraphQL door of the four-part progress of many lessons at once, for the catalog and the topic page. It needs a session, not Premium. */
export class LessonPartsProgressResolver {
    constructor(@InjectQueryBus() private readonly queryBus: QueryBus) {}

    /** Reads, per lesson, the state of Bản chất, Source, Kịch bản and Tự áp dụng, the opener score and the part to resume. */
    @Query(() => [LessonPartsProgressType], { name: "lessonPartsProgress" })
    async lessonPartsProgress(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: LessonPartsProgressInput,
    ): Promise<ReadonlyArray<LessonPartsProgressType>> {
        return this.queryBus.execute(
            new GetLessonPartsProgressQuery({
                request: { lessonIds: input.lessonIds },
                principal: { id: identity.subject, role: "authenticated" },
            }),
        )
    }
}
