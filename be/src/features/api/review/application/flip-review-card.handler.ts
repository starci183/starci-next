import { CommandHandler } from "@nestjs/cqrs"
import { ReviewItemService, type ReviewFlipView } from "@modules/domain/review"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { FlipReviewCardCommand } from "./flip-review-card.command"

@CommandHandler(FlipReviewCardCommand)
/** Reveals the answer of a card and the days each grade would give. */
export class FlipReviewCardHandler extends ICQRSHandler<FlipReviewCardCommand, ReviewFlipView> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly items: ReviewItemService,
    ) {
        super(logger)
    }

    protected override process(message: FlipReviewCardCommand): Promise<ReviewFlipView> {
        return this.items.flip(
            message.params.principal.id,
            message.params.request.itemId,
            message.params.request.locale,
        )
    }
}
