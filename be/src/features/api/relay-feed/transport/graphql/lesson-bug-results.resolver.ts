import { Args, Mutation, Query, Resolver } from "@nestjs/graphql"
import type { CommandBus, QueryBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectCommandBus, InjectQueryBus } from "@modules/platform/cqrs"
import type { LessonBugResult } from "@modules/domain/relay"
import { GetLessonBugResultsQuery } from "../../application/get-lesson-bug-results.query"
import { OpenLessonBugHintCommand } from "../../application/open-lesson-bug-hint.command"
import { LessonBugResultsInput, OpenLessonBugHintInput } from "./dto/lesson-bug-results.input"
import { LessonBugResultType } from "./dto/lesson-bug-result.type"

/** A result for the wire, field by field. */
const toType = (result: LessonBugResult): LessonBugResultType => ({
    testId: result.testId,
    status: result.status,
    isLocked: result.isLocked,
    at: result.at,
    received: result.received,
    output: result.output,
    pass: result.pass,
    fail: result.fail,
    hints: [...result.hints],
    hintsOpened: result.hintsOpened,
    hintCount: result.hintCount,
})

@Resolver()
/** GraphQL doors of Tìm sạn for the signed-in learner: the per-test results of the bug pack and the next hint of a red test. */
export class LessonBugResultsResolver {
    constructor(
        @InjectQueryBus() private readonly queryBus: QueryBus,
        @InjectCommandBus() private readonly commandBus: CommandBus,
    ) {}

    /** Reads every test of the bug pack with the learner's newest run; the page re-reads it while a run is in flight. */
    @Query(() => [LessonBugResultType], {
        name: "lessonBugResults",
        description:
            "Every Tìm sạn test of a lesson with the learner's newest relayed run (check id bug:<test id>). pass is released after a green run, fail and the opened hints after a red one; the final test stays locked until every other test is green. Poll while any status is running.",
    })
    async lessonBugResults(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: LessonBugResultsInput,
    ): Promise<ReadonlyArray<LessonBugResultType>> {
        const results: ReadonlyArray<LessonBugResult> = await this.queryBus.execute(
            new GetLessonBugResultsQuery({
                request: { lessonId: input.lessonId, locale: input.locale },
                principal: { id: identity.subject, role: "authenticated" },
            }),
        )
        return results.map((result) => toType(result))
    }

    /** Opens the next hint of a red test, one at a time, and records it. */
    @Mutation(() => LessonBugResultType, { name: "openLessonBugHint" })
    async openLessonBugHint(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: OpenLessonBugHintInput,
    ): Promise<LessonBugResultType> {
        const result: LessonBugResult = await this.commandBus.execute(
            new OpenLessonBugHintCommand({
                request: { lessonId: input.lessonId, locale: input.locale, testId: input.testId },
                principal: { id: identity.subject, role: "authenticated" },
            }),
        )
        return toType(result)
    }
}
