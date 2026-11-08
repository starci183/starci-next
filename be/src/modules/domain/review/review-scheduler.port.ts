import { injector, type TypedParameterDecorator } from "@modules/platform/composition"
import type { ReviewScheduler } from "./review-scheduler.policy"

/** Token of the scheduler the app binds; the module binds the fixed ladder. */
export const REVIEW_SCHEDULER: unique symbol = Symbol("domain.review.scheduler")

/** Injects the scheduler. Parameter type: ReviewScheduler. */
export const InjectReviewScheduler = (): TypedParameterDecorator<ReviewScheduler> =>
    injector<ReviewScheduler>(REVIEW_SCHEDULER)
