import { Field, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** What the learner sees about a pending pairing before confirming it. */
export class RelayPairingType {
    /** The device name the CLI reported. */
    @Field(() => String)
    name!: string

    /** The device platform: windows, macos or linux. */
    @Field(() => String)
    platform!: string

    /** The UTC instant the pairing lapses. */
    @Field(() => String)
    expiresAt!: string
}
