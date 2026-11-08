import { QueryHandler } from "@nestjs/cqrs"
import { AttemptReadService, type AttemptView } from "@modules/domain/attempt"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { GetLessonAttemptQuery } from "./get-lesson-attempt.query"

@QueryHandler(GetLessonAttemptQuery)
/** Answers one attempt of the learner who asks. */
export class GetLessonAttemptHandler extends ICQRSHandler<GetLessonAttemptQuery, AttemptView> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly attempts: AttemptReadService,
    ) {
        super(logger)
    }

    protected override process(query: GetLessonAttemptQuery): Promise<AttemptView> {
        return this.attempts.find({ learnerId: query.params.principal.id, attemptId: query.params.request.attemptId })
    }
}
