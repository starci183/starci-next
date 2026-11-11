import { QueryHandler } from "@nestjs/cqrs"
import { LessonReadService, type LessonArchiveView } from "@modules/domain/lesson"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { GetLessonWorkspaceArchiveQuery } from "./get-lesson-workspace-archive.query"

@QueryHandler(GetLessonWorkspaceArchiveQuery)
/** Answers the workspace archive of a lesson for a learner who holds Premium. */
export class GetLessonWorkspaceArchiveHandler extends ICQRSHandler<GetLessonWorkspaceArchiveQuery, LessonArchiveView> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly lessons: LessonReadService,
    ) {
        super(logger)
    }

    protected override process(query: GetLessonWorkspaceArchiveQuery): Promise<LessonArchiveView> {
        return this.lessons.workspaceArchive({
            id: query.params.request.id,
            language: query.params.request.language,
            learnerId: query.params.principal.id,
        })
    }
}
