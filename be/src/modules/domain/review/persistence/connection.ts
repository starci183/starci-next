import { ReviewDeckEntity } from "./entities/review-deck.entity"
import { ReviewDeckVersionEntity } from "./entities/review-deck-version.entity"
import { ReviewCardEntity } from "./entities/review-card.entity"
import { ReviewStateEntity } from "./entities/review-state.entity"
import { ReviewReviewEntity } from "./entities/review-review.entity"
import { ReviewAnswerEntity } from "./entities/review-answer.entity"
import { ReviewLearnerDeckEntity } from "./entities/review-learner-deck.entity"
import { ReviewSettingsEntity } from "./entities/review-settings.entity"
import { InitReview1796400000000 } from "./migrations/1796400000000-init-review"
import { ReviewDueNotice1796400000001 } from "./migrations/1796400000001-review-due-notice"

/** The entities of the review capability. */
export const reviewEntities: Array<
    | typeof ReviewDeckEntity
    | typeof ReviewDeckVersionEntity
    | typeof ReviewCardEntity
    | typeof ReviewStateEntity
    | typeof ReviewReviewEntity
    | typeof ReviewAnswerEntity
    | typeof ReviewLearnerDeckEntity
    | typeof ReviewSettingsEntity
> = [
    ReviewDeckEntity,
    ReviewDeckVersionEntity,
    ReviewCardEntity,
    ReviewStateEntity,
    ReviewReviewEntity,
    ReviewAnswerEntity,
    ReviewLearnerDeckEntity,
    ReviewSettingsEntity,
]

/** The migrations of the review capability, in the order they run. */
export const reviewMigrations: Array<typeof InitReview1796400000000 | typeof ReviewDueNotice1796400000001> = [
    InitReview1796400000000,
    ReviewDueNotice1796400000001,
]
