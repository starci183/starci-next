import { CommandHandler } from "@nestjs/cqrs"
import { ReviewItemService, type ReviewClozeResult } from "@modules/domain/review"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { CheckReviewClozeCommand } from "./check-review-cloze.command"

@CommandHandler(CheckReviewClozeCommand)
/** Checks a picked choice against the hidden term; answers correct or not. */
export class CheckReviewClozeHandler extends ICQRSHandler<CheckReviewClozeCommand, ReviewClozeResult> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly items: ReviewItemService,
    ) {
        super(logger)
    }

    protected override process(message: CheckReviewClozeCommand): Promise<ReviewClozeResult> {
        return this.items.checkCloze(
            message.params.principal.id,
            message.params.request.itemId,
            message.params.request.n,
            message.params.request.choice,
            message.params.request.locale,
        )
    }
}
