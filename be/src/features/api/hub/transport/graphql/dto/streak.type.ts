import { Field, ObjectType, Int } from "@nestjs/graphql"
import { HubFreezesType } from "./hub-freezes.type"
import { HubWeekType } from "./hub-week.type"
import { StreakDayType } from "./streak-day.type"
import { StreakReminderType } from "./streak-reminder.type"
import { StreakShardCounterType } from "./streak-shard-counter.type"

@ObjectType()
/** The whole streak of a learner. */
export class StreakType {
    /** Today, YYYY-MM-DD. */
    @Field(() => String)
    today!: string

    /** The streak, today included once it counts. */
    @Field(() => Int)
    current!: number

    /** The best streak. */
    @Field(() => Int)
    longest!: number

    /** Whether today counts. */
    @Field(() => Boolean)
    todayCounted!: boolean

    /** The last 30 days, oldest first. */
    @Field(() => [StreakDayType])
    days!: Array<StreakDayType>

    /** The week so far and its goal. */
    @Field(() => HubWeekType)
    week!: HubWeekType

    /** The freezes held. */
    @Field(() => HubFreezesType)
    freezes!: HubFreezesType

    /** One counter per shard. */
    @Field(() => [StreakShardCounterType])
    shardCounters!: Array<StreakShardCounterType>

    /** The badge slugs earned. */
    @Field(() => [String])
    badges!: Array<string>

    /** The reminder, or null. */
    @Field(() => StreakReminderType, { nullable: true })
    reminder!: StreakReminderType | null
}
