import { QueryHandler } from "@nestjs/cqrs"
import { CourseRungService, type CourseRungFile } from "@modules/domain/course"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { GetCourseRungQuery } from "./get-course-rung.query"

@QueryHandler(GetCourseRungQuery)
/** Answers one rung of a case's reference diff, only once the server recorded the case green for the learner. */
export class GetCourseRungHandler extends ICQRSHandler<GetCourseRungQuery, CourseRungFile> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly rungs: CourseRungService,
    ) {
        super(logger)
    }

    protected override process(query: GetCourseRungQuery): Promise<CourseRungFile> {
        const { learnerId, lessonId, caseId, tag } = query.params.request
        return this.rungs.diffRung(learnerId, lessonId, caseId, tag)
    }
}
