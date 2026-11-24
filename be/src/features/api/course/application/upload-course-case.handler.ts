import { CommandHandler } from "@nestjs/cqrs"
import { CourseCaseService, CourseError, CourseErrorCode } from "@modules/domain/course"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { caseEventOfInput, type CaseEvent } from "@modules/platform/relay-protocol"
import { UploadCourseCaseCommand } from "./upload-course-case.command"
import type { CourseCaseUpload } from "./upload-course-case.contracts"

/** True when the task id of the upload (`course:<course>/<lesson>`) names the lesson the event is about. */
const taskNamesLesson = (taskId: string, event: CaseEvent): boolean =>
    taskId.startsWith("course:") && taskId.endsWith(`/${event.lessonId}`)

@CommandHandler(UploadCourseCaseCommand)
/**
 * Stores one case event of a paired device. The input is read with the relay protocol's own schema (unknown fields are refused, never
 * dropped) and its task id must name the event's lesson; a resend of the same client event id stores nothing twice.
 */
export class UploadCourseCaseHandler extends ICQRSHandler<UploadCourseCaseCommand, CourseCaseUpload> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly cases: CourseCaseService,
    ) {
        super(logger)
    }

    protected override async process(command: UploadCourseCaseCommand): Promise<CourseCaseUpload> {
        const { learnerId, mutation, input } = command.params.request
        const read = caseEventOfInput(mutation, input)
        if (read.kind === "invalid" || !taskNamesLesson(read.taskId, read.event))
            throw new CourseError({ code: CourseErrorCode.PayloadInvalid })
        const { event, eventId } = read
        if (event.type === "case.result") await this.cases.recordCaseResult(learnerId, eventId, event)
        else if (event.type === "case.hint") await this.cases.recordHint(learnerId, event)
        else await this.cases.recordReset(learnerId, event)
        return { eventId, accepted: true }
    }
}
