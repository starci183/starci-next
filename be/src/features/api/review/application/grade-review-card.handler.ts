import { CommandHandler } from "@nestjs/cqrs"
import { ReviewGradeService, type ReviewGradeView } from "@modules/domain/review"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { GradeReviewCardCommand } from "./grade-review-card.command"

@CommandHandler(GradeReviewCardCommand)
/** Stores the self-grade of a revealed item and schedules its next review. */
export class GradeReviewCardHandler extends ICQRSHandler<GradeReviewCardCommand, ReviewGradeView> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly grades: ReviewGradeService,
    ) {
        super(logger)
    }

    protected override process(message: GradeReviewCardCommand): Promise<ReviewGradeView> {
        return this.grades.grade({ learnerId: message.params.principal.id, ...message.params.request })
    }
}
