import { CommandHandler } from "@nestjs/cqrs"
import { RelayLabService, type CourseLabRequested } from "@modules/domain/relay"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { StartCourseLabCommand } from "./start-course-lab.command"

@CommandHandler(StartCourseLabCommand)
/** Signs and pushes the boot manifest of a lab to the learner's online device; none online is RELAY_DEVICE_OFFLINE. */
export class StartCourseLabHandler extends ICQRSHandler<StartCourseLabCommand, CourseLabRequested> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly lab: RelayLabService,
    ) {
        super(logger)
    }

    protected override process(command: StartCourseLabCommand): Promise<CourseLabRequested> {
        const { courseId, lessonId } = command.params.request
        return this.lab.start(command.params.principal.id, courseId, lessonId)
    }
}
