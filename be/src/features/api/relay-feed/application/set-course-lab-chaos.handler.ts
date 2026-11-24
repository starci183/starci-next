import { CommandHandler } from "@nestjs/cqrs"
import { RelayLabService, type CourseLabRequested } from "@modules/domain/relay"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { SetCourseLabChaosCommand } from "./set-course-lab-chaos.command"

@CommandHandler(SetCourseLabChaosCommand)
/** Signs and pushes the chaos manifest of a lab to the learner's online device; a switch the lab does not name is RELAY_PAYLOAD_INVALID. */
export class SetCourseLabChaosHandler extends ICQRSHandler<SetCourseLabChaosCommand, CourseLabRequested> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly lab: RelayLabService,
    ) {
        super(logger)
    }

    protected override process(command: SetCourseLabChaosCommand): Promise<CourseLabRequested> {
        const { courseId, lessonId, chaosIds } = command.params.request
        return this.lab.setChaos(command.params.principal.id, courseId, lessonId, chaosIds)
    }
}
