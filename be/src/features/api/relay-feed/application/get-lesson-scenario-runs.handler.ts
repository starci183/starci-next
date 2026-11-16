import { QueryHandler } from "@nestjs/cqrs"
import { RelayLessonService, type LessonScenarioRunView } from "@modules/domain/relay"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { GetLessonScenarioRunsQuery } from "./get-lesson-scenario-runs.query"

@QueryHandler(GetLessonScenarioRunsQuery)
/** Answers the newest relayed run of each scenario of a lesson for the learner who asks. */
export class GetLessonScenarioRunsHandler extends ICQRSHandler<
    GetLessonScenarioRunsQuery,
    ReadonlyArray<LessonScenarioRunView>
> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly lessons: RelayLessonService,
    ) {
        super(logger)
    }

    protected override process(query: GetLessonScenarioRunsQuery): Promise<ReadonlyArray<LessonScenarioRunView>> {
        return this.lessons.runs(query.params.principal.id, query.params.request.lessonId)
    }
}
