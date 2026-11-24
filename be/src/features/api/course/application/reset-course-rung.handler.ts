import { CommandHandler } from "@nestjs/cqrs"
import { CourseError, CourseErrorCode, CourseRungService, type CourseRungFile } from "@modules/domain/course"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { caseEventOfInput } from "@modules/platform/relay-protocol"
import { ResetCourseRungCommand } from "./reset-course-rung.command"
import { taskNamesLesson } from "./upload-course-case.handler"

@CommandHandler(ResetCourseRungCommand)
/**
 * The reset door of a paired device. Its input is the `case.reset` upload the relay protocol already defines, read with the protocol's
 * own schema (unknown fields refused), so the reset is recorded exactly as the queued event would be; the answer adds the case's rung.
 */
export class ResetCourseRungHandler extends ICQRSHandler<ResetCourseRungCommand, CourseRungFile> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly rungs: CourseRungService,
    ) {
        super(logger)
    }

    protected override process(command: ResetCourseRungCommand): Promise<CourseRungFile> {
        const { learnerId, input } = command.params.request
        const read = caseEventOfInput("relayLabCaseReset", input)
        if (read.kind === "invalid" || read.event.type !== "case.reset" || !taskNamesLesson(read.taskId, read.event))
            throw new CourseError({ code: CourseErrorCode.PayloadInvalid })
        return this.rungs.resetTo(learnerId, read.event)
    }
}
