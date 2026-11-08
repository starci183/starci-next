import { Field, Int, ObjectType } from "@nestjs/graphql"
import { RecallGoalType } from "./recall-goal.type"
import { RecallItemSummaryType } from "./recall-item-summary.type"

@ObjectType()
/** The review day of a learner. */
export class RecallTodayType {
    /** The day (Asia/Ho_Chi_Minh). */
    @Field(() => String)
    date!: string

    /** Items due today, overdue included, that the learner can review. */
    @Field(() => Int)
    due!: number

    /** The part of due that is before today. */
    @Field(() => Int)
    overdue!: number

    /** New items offered today, up to the goal. */
    @Field(() => Int)
    newAvailable!: number

    /** Items waiting that need Premium. */
    @Field(() => Int)
    lockedCount!: number

    /** The goal. */
    @Field(() => RecallGoalType)
    goal!: RecallGoalType

    /** The due items, then the new items, then the locked due items. */
    @Field(() => [RecallItemSummaryType])
    items!: ReadonlyArray<RecallItemSummaryType>
}
