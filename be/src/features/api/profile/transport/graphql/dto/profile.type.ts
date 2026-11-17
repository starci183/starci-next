import { Field, ObjectType } from "@nestjs/graphql"
import { AvatarLimitsType } from "./avatar-limits.type"
import { ProfileGoalType } from "./profile-goal.type"

@ObjectType()
/** The profile of a learner. */
export class ProfileType {
    /** The name the learner chose, or null while the name of their account shows. */
    @Field(() => String, { nullable: true })
    displayName!: string | null

    /** A short-lived address of the avatar, or null. */
    @Field(() => String, { nullable: true })
    avatarUrl!: string | null

    /** When the avatar was set, or null. */
    @Field(() => String, { nullable: true })
    avatarUpdatedAt!: string | null

    /** The goal path, or null when none is chosen. */
    @Field(() => ProfileGoalType, { nullable: true })
    goal!: ProfileGoalType | null

    /** The limits an avatar upload is held to. */
    @Field(() => AvatarLimitsType)
    limits!: AvatarLimitsType
}
