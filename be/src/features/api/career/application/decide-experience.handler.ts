import { CommandHandler } from "@nestjs/cqrs"
import { ExperienceReviewService, type DecisionResultView } from "@modules/domain/career"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { DecideExperienceCommand } from "./decide-experience.command"

@CommandHandler(DecideExperienceCommand)
/** Hands the message to the career capability, which authorizes and decides. */
export class DecideExperienceHandler extends ICQRSHandler<DecideExperienceCommand, ReadonlyArray<DecisionResultView>> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly reviews: ExperienceReviewService,
    ) {
        super(logger)
    }

    protected override process(command: DecideExperienceCommand): Promise<ReadonlyArray<DecisionResultView>> {
        return this.reviews.decide({
            signer: { subject: command.params.principal.id, roles: command.params.request.roles },
            decisions: command.params.request.decisions,
        })
    }
}
