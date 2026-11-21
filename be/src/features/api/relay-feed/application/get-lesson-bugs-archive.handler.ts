import { QueryHandler } from "@nestjs/cqrs"
import type { LessonSourceArchive } from "@modules/domain/lesson"
import { RelayFeedService } from "@modules/domain/relay"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { GetLessonBugsArchiveQuery } from "./get-lesson-bugs-archive.query"

@QueryHandler(GetLessonBugsArchiveQuery)
/** Answers the Tìm sạn bug-pack tarball for a paired device whose learner may read Tìm sạn. */
export class GetLessonBugsArchiveHandler extends ICQRSHandler<GetLessonBugsArchiveQuery, LessonSourceArchive> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly feed: RelayFeedService,
    ) {
        super(logger)
    }

    protected override process(query: GetLessonBugsArchiveQuery): Promise<LessonSourceArchive> {
        return this.feed.bugsDownload(query.params.request.device, query.params.request.lessonId)
    }
}
