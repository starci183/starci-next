import { QueryHandler } from "@nestjs/cqrs"
import { AttemptMarkService, AttemptReadService } from "@modules/domain/attempt"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import type { LessonProgressWithReads } from "./get-lesson-progress.contracts"
import { GetLessonProgressQuery } from "./get-lesson-progress.query"

@QueryHandler(GetLessonProgressQuery)
/** Answers the progress of the learner who asks in one lesson. */
export class GetLessonProgressHandler extends ICQRSHandler<GetLessonProgressQuery, LessonProgressWithReads> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly attempts: AttemptReadService,
        private readonly marks: AttemptMarkService,
    ) {
        super(logger)
    }

    protected override async process(query: GetLessonProgressQuery): Promise<LessonProgressWithReads> {
        const learnerId = query.params.principal.id
        const lessonId = query.params.request.lessonId
        const [progress, readSectionIds] = await Promise.all([
            this.attempts.progress({ learnerId, lessonId, locale: query.params.request.locale }),
            this.marks.readSectionIds(learnerId, lessonId),
        ])
        return { ...progress, readSectionIds }
    }
}
