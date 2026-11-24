import { QueryHandler } from "@nestjs/cqrs"
import { CourseLabService, type CourseLessonView } from "@modules/domain/course"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { GetCourseLessonQuery } from "./get-course-lesson.query"

@QueryHandler(GetCourseLessonQuery)
/** Answers the lab of one lesson for the learner who asks: Premium beyond the free part, hint texts only for the levels they opened, never a grader file. */
export class GetCourseLessonHandler extends ICQRSHandler<GetCourseLessonQuery, CourseLessonView> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly labs: CourseLabService,
    ) {
        super(logger)
    }

    protected override process(query: GetCourseLessonQuery): Promise<CourseLessonView> {
        const { lessonId, locale } = query.params.request
        return this.labs.lessonView(query.params.principal.id, lessonId, locale)
    }
}
