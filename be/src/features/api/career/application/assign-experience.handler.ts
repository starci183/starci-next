import { CommandHandler } from "@nestjs/cqrs"
import { ExperienceReviewService, type ExperienceItemView } from "@modules/domain/career"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { AssignExperienceCommand } from "./assign-experience.command"

@CommandHandler(AssignExperienceCommand)
/** Hands the message to the career capability, which authorizes and decides. */
export class AssignExperienceHandler extends ICQRSHandler<AssignExperienceCommand, ExperienceItemView> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly reviews: ExperienceReviewService,
    ) {
        super(logger)
    }

    protected override process(command: AssignExperienceCommand): Promise<ExperienceItemView> {
        return this.reviews.assign({
            signer: { subject: command.params.principal.id, roles: command.params.request.roles },
            itemId: command.params.request.itemId,
            reviewerId: command.params.request.reviewerId,
        })
    }
}
