import { Module } from "@nestjs/common"
import { GetReviewTodayHandler } from "./application/get-review-today.handler"
import { GetReviewItemHandler } from "./application/get-review-item.handler"
import { CheckReviewClozeHandler } from "./application/check-review-cloze.handler"
import { FlipReviewCardHandler } from "./application/flip-review-card.handler"
import { SubmitReviewRetrievalHandler } from "./application/submit-review-retrieval.handler"
import { GradeReviewCardHandler } from "./application/grade-review-card.handler"
import { ListReviewDecksHandler } from "./application/list-review-decks.handler"
import { AddReviewDeckHandler } from "./application/add-review-deck.handler"
import { RemoveReviewDeckHandler } from "./application/remove-review-deck.handler"
import { SetReviewGoalHandler } from "./application/set-review-goal.handler"
import { GetReviewStatsHandler } from "./application/get-review-stats.handler"
import { ConfigurableModuleClass } from "./review.module-definition"

@Module({
    providers: [
        GetReviewTodayHandler,
        GetReviewItemHandler,
        CheckReviewClozeHandler,
        FlipReviewCardHandler,
        SubmitReviewRetrievalHandler,
        GradeReviewCardHandler,
        ListReviewDecksHandler,
        AddReviewDeckHandler,
        RemoveReviewDeckHandler,
        SetReviewGoalHandler,
        GetReviewStatsHandler,
    ],
})
/** Application handlers of the review feature: the daily queue, items, grades, decks, the goal and the statistics. */
export class ReviewApiModule extends ConfigurableModuleClass {}
