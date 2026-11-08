import { Field, ObjectType } from "@nestjs/graphql"
import { HubActivePathType } from "./hub-active-path.type"
import { HubLayerType } from "./hub-layer.type"
import { HubShardType } from "./hub-shard.type"
import { HubStreakType } from "./hub-streak.type"
import { HubTodayType } from "./hub-today.type"

@ObjectType()
/** Everything the hub screen shows. */
export class LearnerHubType {
    /** The active path, or null. */
    @Field(() => HubActivePathType, { nullable: true })
    activePath!: HubActivePathType | null

    /** What is left for today's streak. */
    @Field(() => [HubTodayType])
    today!: Array<HubTodayType>

    /** The streak card. */
    @Field(() => HubStreakType)
    streak!: HubStreakType

    /** The six learning shards. */
    @Field(() => [HubShardType])
    shards!: Array<HubShardType>

    /** The three layers. */
    @Field(() => [HubLayerType])
    layers!: Array<HubLayerType>
}
