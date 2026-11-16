import { QueryHandler } from "@nestjs/cqrs"
import { AttemptOpenerService, type OpenerScoreView } from "@modules/domain/attempt"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { GetLessonOpenerScoresQuery } from "./get-lesson-opener-scores.query"

@QueryHandler(GetLessonOpenerScoresQuery)
/** Answers the opener scores (before and after) of the learner who asks. */
export class GetLessonOpenerScoresHandler extends ICQRSHandler<
    GetLessonOpenerScoresQuery,
    ReadonlyArray<OpenerScoreView>
> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly openers: AttemptOpenerService,
    ) {
        super(logger)
    }

    protected override process(query: GetLessonOpenerScoresQuery): Promise<ReadonlyArray<OpenerScoreView>> {
        return this.openers.scores({
            learnerId: query.params.principal.id,
            lessonIds: query.params.request.lessonIds,
        })
    }
}
