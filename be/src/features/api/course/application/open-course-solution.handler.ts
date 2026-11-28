import { CommandHandler } from "@nestjs/cqrs"
import { CourseCaseService, type CourseSolutionOpened } from "@modules/domain/course"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { OpenCourseSolutionCommand } from "./open-course-solution.command"

@CommandHandler(OpenCourseSolutionCommand)
/** Stores that the learner opened the solution of an open case, so its fix is revealed; asking again changes nothing. */
export class OpenCourseSolutionHandler extends ICQRSHandler<OpenCourseSolutionCommand, CourseSolutionOpened> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly cases: CourseCaseService,
    ) {
        super(logger)
    }

    protected override process(command: OpenCourseSolutionCommand): Promise<CourseSolutionOpened> {
        const { lessonId, caseId } = command.params.request
        return this.cases.openSolution(command.params.principal.id, lessonId, caseId)
    }
}
