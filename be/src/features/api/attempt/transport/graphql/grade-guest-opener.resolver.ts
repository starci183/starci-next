import { Args, Query, Resolver } from "@nestjs/graphql"
import type { QueryBus } from "@nestjs/cqrs"
import { Public, PublicReason } from "@modules/domain/identity"
import { InjectQueryBus } from "@modules/platform/cqrs"
import { RateBucket, RateLimit, RateTier } from "@modules/platform/http-security"
import { GradeGuestOpenerQuery } from "../../application/grade-guest-opener.query"
import { GradeGuestOpenerInput } from "./dto/grade-guest-opener.input"
import { LessonAttemptResultType } from "./dto/lesson-attempt-result.type"
import { toGradeGuestOpenerParams, toGuestGradeType } from "./guest-progress.mapper"

@Resolver()
/** GraphQL door that grades one free choice for a guest; it needs no session, stores nothing, and is limited per address. */
export class GradeGuestOpenerResolver {
    constructor(@InjectQueryBus() private readonly queryBus: QueryBus) {}

    /** Grades the pick and answers the right option with every explanation; content that is not free needs Premium. */
    @Query(() => LessonAttemptResultType, { name: "gradeGuestOpener" })
    @Public({ reason: PublicReason.GuestRead })
    @RateLimit(RateTier.Strict, RateBucket.GuestGrade)
    async gradeGuestOpener(@Args("input") input: GradeGuestOpenerInput): Promise<LessonAttemptResultType> {
        const result = await this.queryBus.execute(new GradeGuestOpenerQuery(toGradeGuestOpenerParams(input)))
        return toGuestGradeType(result)
    }
}
