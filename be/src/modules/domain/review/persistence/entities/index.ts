import { ReviewDeckEntity } from "./review-deck.entity"
import { ReviewDeckVersionEntity } from "./review-deck-version.entity"
import { ReviewCardEntity } from "./review-card.entity"
import { ReviewStateEntity } from "./review-state.entity"
import { ReviewReviewEntity } from "./review-review.entity"
import { ReviewAnswerEntity } from "./review-answer.entity"
import { ReviewLearnerDeckEntity } from "./review-learner-deck.entity"
import { ReviewSettingsEntity } from "./review-settings.entity"

export {
    ReviewAnswerEntity,
    ReviewCardEntity,
    ReviewDeckEntity,
    ReviewDeckVersionEntity,
    ReviewLearnerDeckEntity,
    ReviewReviewEntity,
    ReviewSettingsEntity,
    ReviewStateEntity,
}

/** The entities of the review capability, named in PRIMARY_ENTITIES of platform/database/entities.ts. */
export const reviewEntities: ReadonlyArray<new () => object> = [
    ReviewDeckEntity,
    ReviewDeckVersionEntity,
    ReviewCardEntity,
    ReviewStateEntity,
    ReviewReviewEntity,
    ReviewAnswerEntity,
    ReviewLearnerDeckEntity,
    ReviewSettingsEntity,
]
