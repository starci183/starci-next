import { QueryHandler } from "@nestjs/cqrs"
import { RelayLabService, type CourseLabView } from "@modules/domain/relay"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { GetCourseLabQuery } from "./get-course-lab.query"

@QueryHandler(GetCourseLabQuery)
/** Answers the lab of one lesson for the learner who asks: what their machine last synced, never a hidden file. */
export class GetCourseLabHandler extends ICQRSHandler<GetCourseLabQuery, CourseLabView> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly lab: RelayLabService,
    ) {
        super(logger)
    }

    protected override process(query: GetCourseLabQuery): Promise<CourseLabView> {
        const { courseId, lessonId } = query.params.request
        return this.lab.view(query.params.principal.id, courseId, lessonId)
    }
}
