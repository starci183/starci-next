import { QueryHandler } from "@nestjs/cqrs"
import { RelayFeedService, type LessonScenarioRunView } from "@modules/domain/relay"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { GetLessonScenarioRunsQuery } from "./get-lesson-scenario-runs.query"

@QueryHandler(GetLessonScenarioRunsQuery)
/** Answers the newest relayed run of each scenario of a lesson for the learner who asks, limited to the parts they may read. */
export class GetLessonScenarioRunsHandler extends ICQRSHandler<
    GetLessonScenarioRunsQuery,
    ReadonlyArray<LessonScenarioRunView>
> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly feed: RelayFeedService,
    ) {
        super(logger)
    }

    protected override process(query: GetLessonScenarioRunsQuery): Promise<ReadonlyArray<LessonScenarioRunView>> {
        return this.feed.lessonRuns(query.params.principal.id, query.params.request.lessonId)
    }
}
