import { CommandHandler } from "@nestjs/cqrs"
import { CourseCaseService, type CourseHintOpened } from "@modules/domain/course"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { OpenCourseHintCommand } from "./open-course-hint.command"

@CommandHandler(OpenCourseHintCommand)
/** Opens a hint level once the level below is open and the case is open, stores it, and answers its text; asking again answers the same text. */
export class OpenCourseHintHandler extends ICQRSHandler<OpenCourseHintCommand, CourseHintOpened> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly cases: CourseCaseService,
    ) {
        super(logger)
    }

    protected override process(command: OpenCourseHintCommand): Promise<CourseHintOpened> {
        const { lessonId, caseId, level, locale } = command.params.request
        return this.cases.openHint(command.params.principal.id, lessonId, caseId, level, locale)
    }
}
