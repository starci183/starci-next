import { Field, ObjectType, Int } from "@nestjs/graphql"
import { HubCounterType } from "./hub-counter.type"
import { HubExperienceType } from "./hub-experience.type"
import { HubProgressType } from "./hub-progress.type"

@ObjectType()
/** One learning shard on the hub. */
export class HubShardType {
    /** The shard id. */
    @Field(() => String)
    shard!: string

    /** The position on the hub, from 1. */
    @Field(() => Int)
    order!: number

    /** The name in the asked locale. */
    @Field(() => String)
    label!: string

    /** Where the shard lives. */
    @Field(() => String)
    route!: string

    /** live or coming-soon. */
    @Field(() => String)
    status!: string

    /** The progress line. */
    @Field(() => HubProgressType)
    progress!: HubProgressType

    /** The streak counter of this shard. */
    @Field(() => HubCounterType)
    counter!: HubCounterType

    /** The days with an action of this shard in the last 30. */
    @Field(() => Int)
    activeDaysLast30!: number

    /** Whether this shard already counted today. */
    @Field(() => Boolean)
    todayCounted!: boolean

    /** The experience counts; null while no experience read exists. */
    @Field(() => HubExperienceType, { nullable: true })
    experience!: HubExperienceType | null

    /** True when the numbers could not be read. */
    @Field(() => Boolean)
    unavailable!: boolean
}
