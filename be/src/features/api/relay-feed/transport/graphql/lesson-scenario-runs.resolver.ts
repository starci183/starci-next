import { Args, Query, Resolver } from "@nestjs/graphql"
import type { QueryBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectQueryBus } from "@modules/platform/cqrs"
import { GetLessonScenarioRunsQuery } from "../../application/get-lesson-scenario-runs.query"
import { LessonScenarioRunsInput } from "./dto/lesson-scenario-runs.input"
import { LessonScenarioRunType } from "./dto/lesson-scenario-run.type"

@Resolver()
/** GraphQL door of a lesson's scenario runs for the signed-in learner (a session, not a device token). */
export class LessonScenarioRunsResolver {
    constructor(@InjectQueryBus() private readonly queryBus: QueryBus) {}

    /** Reads the newest relayed run of each scenario of the lesson; the page polls it while a run is in flight. */
    @Query(() => [LessonScenarioRunType], { name: "lessonScenarioRuns" })
    async lessonScenarioRuns(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: LessonScenarioRunsInput,
    ): Promise<ReadonlyArray<LessonScenarioRunType>> {
        return this.queryBus.execute(
            new GetLessonScenarioRunsQuery({
                request: { lessonId: input.lessonId },
                principal: { id: identity.subject, role: "authenticated" },
            }),
        )
    }
}
