import { CommandHandler } from "@nestjs/cqrs"
import { AttemptService, type AttemptView } from "@modules/domain/attempt"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { SubmitLessonAttemptCommand } from "./submit-lesson-attempt.command"

@CommandHandler(SubmitLessonAttemptCommand)
/** Hands the answer of the learner to the attempt capability, which stores and grades it. */
export class SubmitLessonAttemptHandler extends ICQRSHandler<SubmitLessonAttemptCommand, AttemptView> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly attempts: AttemptService,
    ) {
        super(logger)
    }

    protected override process(command: SubmitLessonAttemptCommand): Promise<AttemptView> {
        return this.attempts.submit({ learnerId: command.params.principal.id, ...command.params.request })
    }
}
