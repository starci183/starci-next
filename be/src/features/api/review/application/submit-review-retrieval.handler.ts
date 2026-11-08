import { CommandHandler } from "@nestjs/cqrs"
import { ReviewItemService, type ReviewFlipView } from "@modules/domain/review"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { SubmitReviewRetrievalCommand } from "./submit-review-retrieval.command"

@CommandHandler(SubmitReviewRetrievalCommand)
/** Stores the written answer to a retrieval item, then shows the sample answer. */
export class SubmitReviewRetrievalHandler extends ICQRSHandler<SubmitReviewRetrievalCommand, ReviewFlipView> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly items: ReviewItemService,
    ) {
        super(logger)
    }

    protected override process(message: SubmitReviewRetrievalCommand): Promise<ReviewFlipView> {
        return this.items.submitRetrieval(
            message.params.principal.id,
            message.params.request.itemId,
            message.params.request.revision,
            message.params.request.text,
            message.params.request.locale,
        )
    }
}
