import { Field, ObjectType, Int } from "@nestjs/graphql"
import { HubFreezesType } from "./hub-freezes.type"
import { HubWeekType } from "./hub-week.type"
import { StreakDayType } from "./streak-day.type"

@ObjectType()
/** The streak card of the hub. */
export class HubStreakType {
    /** The streak, today included once it counts. */
    @Field(() => Int)
    current!: number

    /** The best streak. */
    @Field(() => Int)
    longest!: number

    /** Whether today counts. */
    @Field(() => Boolean)
    todayCounted!: boolean

    /** The week so far and its goal. */
    @Field(() => HubWeekType)
    week!: HubWeekType

    /** The freezes held. */
    @Field(() => HubFreezesType)
    freezes!: HubFreezesType

    /** The last seven days, oldest first. */
    @Field(() => [StreakDayType])
    days!: Array<StreakDayType>
}
