import { Module } from "@nestjs/common"
import { ReviewApiModule } from "../../review.module"
import { ConfigurableModuleClass } from "./review-graphql.module-definition"
import { GetReviewTodayResolver } from "./get-review-today.resolver"
import { GetReviewItemResolver } from "./get-review-item.resolver"
import { CheckReviewClozeResolver } from "./check-review-cloze.resolver"
import { FlipReviewCardResolver } from "./flip-review-card.resolver"
import { SubmitReviewRetrievalResolver } from "./submit-review-retrieval.resolver"
import { GradeReviewCardResolver } from "./grade-review-card.resolver"
import { ListReviewDecksResolver } from "./list-review-decks.resolver"
import { AddReviewDeckResolver } from "./add-review-deck.resolver"
import { RemoveReviewDeckResolver } from "./remove-review-deck.resolver"
import { SetReviewGoalResolver } from "./set-review-goal.resolver"
import { GetReviewStatsResolver } from "./get-review-stats.resolver"

@Module({
    imports: [ReviewApiModule.register({})],
    providers: [
        GetReviewTodayResolver,
        GetReviewItemResolver,
        CheckReviewClozeResolver,
        FlipReviewCardResolver,
        SubmitReviewRetrievalResolver,
        GradeReviewCardResolver,
        ListReviewDecksResolver,
        AddReviewDeckResolver,
        RemoveReviewDeckResolver,
        SetReviewGoalResolver,
        GetReviewStatsResolver,
    ],
})
/** The GraphQL transport of the review feature: the daily queue, items, grades, decks, the goal and the statistics. */
export class ReviewGraphqlModule extends ConfigurableModuleClass {}
