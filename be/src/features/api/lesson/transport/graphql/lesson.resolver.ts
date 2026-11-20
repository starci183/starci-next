import { Args, Query, Resolver } from "@nestjs/graphql"
import type { QueryBus } from "@nestjs/cqrs"
import { MaybePrincipal, Public, PublicReason, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectQueryBus } from "@modules/platform/cqrs"
import { GetLessonQuery } from "../../application/get-lesson.query"
import { LessonInput } from "./dto/lesson.input"
import { LessonType } from "./dto/lesson.type"
import { toGetLessonParams, toLessonType } from "./get-lesson.mapper"

@Resolver()
/** GraphQL door of one lesson; a guest may read it and sees the free part only; Premium opens the phases beyond the free one. */
export class LessonResolver {
    constructor(@InjectQueryBus() private readonly queryBus: QueryBus) {}

    /** Reads the public projection of one live lesson; a locked phase keeps only its title without Premium. */
    @Public({ reason: PublicReason.GuestRead })
    @Query(() => LessonType, { name: "lesson" })
    async lesson(
        @MaybePrincipal() identity: IdentityPrincipal | undefined,
        @Args("input") input: LessonInput,
    ): Promise<LessonType> {
        const result = await this.queryBus.execute(new GetLessonQuery(toGetLessonParams(identity, input)))
        return toLessonType(result)
    }
}
