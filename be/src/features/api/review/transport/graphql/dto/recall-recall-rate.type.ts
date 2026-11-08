import { Field, Float, Int, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** The recall rate of the n-th review of items. */
export class RecallRecallRateType {
    /** Which review of an item. */
    @Field(() => Int)
    n!: number

    /** The share graded good or easy, 0 to 1. */
    @Field(() => Float)
    rate!: number
}
