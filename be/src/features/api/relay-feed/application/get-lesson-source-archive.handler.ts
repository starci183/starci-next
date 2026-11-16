import { QueryHandler } from "@nestjs/cqrs"
import type { LessonSourceArchive } from "@modules/domain/lesson"
import { RelayFeedService } from "@modules/domain/relay"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { GetLessonSourceArchiveQuery } from "./get-lesson-source-archive.query"

@QueryHandler(GetLessonSourceArchiveQuery)
/** Answers the lesson source tarball for a paired device whose learner may study the lesson. */
export class GetLessonSourceArchiveHandler extends ICQRSHandler<GetLessonSourceArchiveQuery, LessonSourceArchive> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly feed: RelayFeedService,
    ) {
        super(logger)
    }

    protected override process(query: GetLessonSourceArchiveQuery): Promise<LessonSourceArchive> {
        return this.feed.sourceDownload(query.params.request.device, query.params.request.lessonId)
    }
}
