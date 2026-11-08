import { Field, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** One day of the streak strip. */
export class StreakDayType {
    /** The day, YYYY-MM-DD, Asia/Ho_Chi_Minh. */
    @Field(() => String)
    day!: string

    /** Whether a meaningful action happened. */
    @Field(() => Boolean)
    counted!: boolean

    /** The shards that had an action. */
    @Field(() => [String])
    shards!: Array<string>

    /** Whether a freeze covered the day. */
    @Field(() => Boolean)
    freezeUsed!: boolean
}
