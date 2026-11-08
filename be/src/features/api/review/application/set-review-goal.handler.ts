import { CommandHandler } from "@nestjs/cqrs"
import { ReviewDeckService, type ReviewGoalSetView } from "@modules/domain/review"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { SetReviewGoalCommand } from "./set-review-goal.command"

@CommandHandler(SetReviewGoalCommand)
/** Sets the daily item goal, 5 to 50. */
export class SetReviewGoalHandler extends ICQRSHandler<SetReviewGoalCommand, ReviewGoalSetView> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly decks: ReviewDeckService,
    ) {
        super(logger)
    }

    protected override process(message: SetReviewGoalCommand): Promise<ReviewGoalSetView> {
        return this.decks.setGoal(message.params.principal.id, message.params.request.daily)
    }
}
