import { CommandHandler } from "@nestjs/cqrs"
import { ReviewerService, type ReviewerView } from "@modules/domain/career"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { SetExperienceReviewerCommand } from "./set-experience-reviewer.command"

@CommandHandler(SetExperienceReviewerCommand)
/** Hands the message to the career capability, which authorizes and decides. */
export class SetExperienceReviewerHandler extends ICQRSHandler<SetExperienceReviewerCommand, ReviewerView> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly reviewers: ReviewerService,
    ) {
        super(logger)
    }

    protected override process(command: SetExperienceReviewerCommand): Promise<ReviewerView> {
        return this.reviewers.set({
            signer: { subject: command.params.principal.id, roles: command.params.request.roles },
            ...command.params.request,
        })
    }
}
