import { Field, ObjectType, Int } from "@nestjs/graphql"

@ObjectType()
/** The counter of one shard. */
export class StreakShardCounterType {
    /** The shard id. */
    @Field(() => String)
    shard!: string

    /** Days in a row with an action of this shard. */
    @Field(() => Int)
    current!: number

    /** The best run. */
    @Field(() => Int)
    longest!: number

    /** The days with an action in the last 30. */
    @Field(() => Int)
    activeDaysLast30!: number
}
