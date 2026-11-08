import { Field, ObjectType } from "@nestjs/graphql"
import { ReviewQueueCountsType } from "./review-queue-counts.type"
import { ReviewQueueItemType } from "./review-queue-item.type"

@ObjectType()
/** The review queue of a signer. */
export class ReviewQueueType {
    /** The role the signer reads it with. */
    @Field(() => String)
    role!: string

    /** The items of the tab, oldest due first. */
    @Field(() => [ReviewQueueItemType])
    items!: ReadonlyArray<ReviewQueueItemType>

    /** How many items each tab holds. */
    @Field(() => ReviewQueueCountsType)
    counts!: ReviewQueueCountsType
}
