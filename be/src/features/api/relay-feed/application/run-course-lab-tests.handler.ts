import { CommandHandler } from "@nestjs/cqrs"
import { RelayLabService, type CourseLabRequested } from "@modules/domain/relay"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { RunCourseLabTestsCommand } from "./run-course-lab-tests.command"

@CommandHandler(RunCourseLabTestsCommand)
/** Signs and pushes the test manifest of a lab to the learner's online device; none online is RELAY_DEVICE_OFFLINE. */
export class RunCourseLabTestsHandler extends ICQRSHandler<RunCourseLabTestsCommand, CourseLabRequested> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly lab: RelayLabService,
    ) {
        super(logger)
    }

    protected override process(command: RunCourseLabTestsCommand): Promise<CourseLabRequested> {
        const { courseId, lessonId } = command.params.request
        return this.lab.runTests(command.params.principal.id, courseId, lessonId)
    }
}
