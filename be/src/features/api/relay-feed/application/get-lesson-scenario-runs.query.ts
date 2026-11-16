import { Query } from "@nestjs/cqrs"
import type { LessonScenarioRunView } from "@modules/domain/relay"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { GetLessonScenarioRunsRequest } from "./get-lesson-scenario-runs.contracts"

/** Asks for the newest relayed run of each scenario of one lesson, for the signed-in learner. */
export class GetLessonScenarioRunsQuery extends Query<ReadonlyArray<LessonScenarioRunView>> {
    constructor(readonly params: ExecuteParams<GetLessonScenarioRunsRequest>) {
        super()
    }
}
