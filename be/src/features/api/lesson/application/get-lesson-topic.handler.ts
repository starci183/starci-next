import { QueryHandler } from "@nestjs/cqrs"
import { LessonReadService, type LessonTopicView } from "@modules/domain/lesson"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { GetLessonTopicQuery } from "./get-lesson-topic.query"

@QueryHandler(GetLessonTopicQuery)
/** Answers the page of one topic. */
export class GetLessonTopicHandler extends ICQRSHandler<GetLessonTopicQuery, LessonTopicView> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly lessons: LessonReadService,
    ) {
        super(logger)
    }

    protected override process(query: GetLessonTopicQuery): Promise<LessonTopicView> {
        return this.lessons.topic({ topic: query.params.request.topic, locale: query.params.request.locale })
    }
}
