import { Field, Int, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** How many items each tab of the queue holds. */
export class ReviewQueueCountsType {
    /** Waiting. */
    @Field(() => Int)
    pending!: number

    /** Overdue. */
    @Field(() => Int)
    overdue!: number

    /** Unassigned. */
    @Field(() => Int)
    unassigned!: number
}
