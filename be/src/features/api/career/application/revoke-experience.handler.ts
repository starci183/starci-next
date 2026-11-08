import { CommandHandler } from "@nestjs/cqrs"
import { ExperienceReviewService, type ExperienceItemView } from "@modules/domain/career"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { RevokeExperienceCommand } from "./revoke-experience.command"

@CommandHandler(RevokeExperienceCommand)
/** Hands the message to the career capability, which authorizes and decides. */
export class RevokeExperienceHandler extends ICQRSHandler<RevokeExperienceCommand, ExperienceItemView> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly reviews: ExperienceReviewService,
    ) {
        super(logger)
    }

    protected override process(command: RevokeExperienceCommand): Promise<ExperienceItemView> {
        return this.reviews.revoke({
            signer: { subject: command.params.principal.id, roles: command.params.request.roles },
            itemId: command.params.request.itemId,
            reason: command.params.request.reason,
        })
    }
}
