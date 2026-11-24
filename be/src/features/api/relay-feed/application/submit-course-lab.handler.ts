import { CommandHandler } from "@nestjs/cqrs"
import { RelayLabService, type CourseLabSubmitted } from "@modules/domain/relay"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { SubmitCourseLabCommand } from "./submit-course-lab.command"

@CommandHandler(SubmitCourseLabCommand)
/** Stores a submission and pushes its grading manifest (hidden files, random order, nonce) to the learner's online device. */
export class SubmitCourseLabHandler extends ICQRSHandler<SubmitCourseLabCommand, CourseLabSubmitted> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly lab: RelayLabService,
    ) {
        super(logger)
    }

    protected override process(command: SubmitCourseLabCommand): Promise<CourseLabSubmitted> {
        const { courseId, lessonId, hintsOpened, timeSpentMs } = command.params.request
        return this.lab.submit(command.params.principal.id, courseId, lessonId, { hintsOpened, timeSpentMs })
    }
}
