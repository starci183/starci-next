import { QueryHandler } from "@nestjs/cqrs"
import { AttemptReadService, type LessonProgressView } from "@modules/domain/attempt"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { GetLessonProgressQuery } from "./get-lesson-progress.query"

@QueryHandler(GetLessonProgressQuery)
/** Answers the progress of the learner who asks in one lesson. */
export class GetLessonProgressHandler extends ICQRSHandler<GetLessonProgressQuery, LessonProgressView> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly attempts: AttemptReadService,
    ) {
        super(logger)
    }

    protected override process(query: GetLessonProgressQuery): Promise<LessonProgressView> {
        return this.attempts.progress({
            learnerId: query.params.principal.id,
            lessonId: query.params.request.lessonId,
            locale: query.params.request.locale,
        })
    }
}
