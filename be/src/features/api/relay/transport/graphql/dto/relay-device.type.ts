import { Field, ID, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** One paired device of the learner. */
export class RelayDeviceType {
    /** The device id. */
    @Field(() => ID)
    id!: string

    /** The device name. */
    @Field(() => String)
    name!: string

    /** The device platform: windows, macos or linux. */
    @Field(() => String)
    platform!: string

    /** The UTC instant the learner confirmed the pairing. */
    @Field(() => String)
    pairedAt!: string

    /** The UTC instant the relay last heard from the device, or null. */
    @Field(() => String, { nullable: true })
    lastSeenAt!: string | null

    /** Whether the device was heard from within the last minute. */
    @Field(() => Boolean)
    online!: boolean
}
