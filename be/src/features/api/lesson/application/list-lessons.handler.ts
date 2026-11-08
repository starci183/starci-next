import { QueryHandler } from "@nestjs/cqrs"
import { LessonReadService, type LessonCatalogItemView } from "@modules/domain/lesson"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { ListLessonsQuery } from "./list-lessons.query"

@QueryHandler(ListLessonsQuery)
/** Answers the lesson catalog the lesson capability owns. */
export class ListLessonsHandler extends ICQRSHandler<ListLessonsQuery, ReadonlyArray<LessonCatalogItemView>> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly lessons: LessonReadService,
    ) {
        super(logger)
    }

    protected override process(query: ListLessonsQuery): Promise<ReadonlyArray<LessonCatalogItemView>> {
        return this.lessons.catalog(query.params.request)
    }
}
