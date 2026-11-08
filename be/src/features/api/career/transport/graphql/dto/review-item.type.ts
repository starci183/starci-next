import { Field, ObjectType } from "@nestjs/graphql"
import { ReviewDecisionType } from "./review-decision.type"
import { ReviewQueueItemType } from "./review-queue-item.type"

@ObjectType()
/** One item as a signer reviews it, with its history. */
export class ReviewItemType {
    /** The item. */
    @Field(() => ReviewQueueItemType)
    item!: ReviewQueueItemType

    /** The audit trail, oldest first. */
    @Field(() => [ReviewDecisionType])
    history!: ReadonlyArray<ReviewDecisionType>
}
