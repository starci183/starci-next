import { Field, InputType } from "@nestjs/graphql"
import { IsIn } from "class-validator"
import type { ReviewQueueTab } from "@modules/domain/career"

/** The tabs of the queue. */
const REVIEW_QUEUE_TABS: ReadonlyArray<ReviewQueueTab> = ["pending", "overdue", "unassigned"]

@InputType()
/** Which tab of the queue the signer reads. */
export class ReviewQueueInput {
    /** Waiting (pending), Overdue (overdue) or Unassigned (unassigned); pending when left out. */
    @Field(() => String, { defaultValue: "pending" })
    @IsIn(REVIEW_QUEUE_TABS)
    tab: ReviewQueueTab = "pending"
}
