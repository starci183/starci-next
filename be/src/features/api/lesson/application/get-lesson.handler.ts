import { QueryHandler } from "@nestjs/cqrs"
import { LessonReadService, type LessonView } from "@modules/domain/lesson"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { GetLessonQuery } from "./get-lesson.query"

@QueryHandler(GetLessonQuery)
/** Answers the public projection of one lesson for the learner who asked. */
export class GetLessonHandler extends ICQRSHandler<GetLessonQuery, LessonView> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly lessons: LessonReadService,
    ) {
        super(logger)
    }

    protected override process(query: GetLessonQuery): Promise<LessonView> {
        return this.lessons.find({
            id: query.params.request.id,
            locale: query.params.request.locale,
            learnerId: query.params.principal.id,
        })
    }
}
