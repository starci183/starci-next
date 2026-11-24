import { Field, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** The six-digit pairing code the web issued. */
export class RelayPairCodeType {
    /** Six digits. */
    @Field(() => String)
    code!: string

    /** When it lapses, ISO 8601. */
    @Field(() => String)
    expiresAt!: string
}

@ObjectType()
/** The device token a CLI receives once, after claiming a pairing code. */
export class ClaimedRelayDeviceTokenType {
    /** The bearer secret of the device. */
    @Field(() => String)
    deviceToken!: string
}

@ObjectType()
/** What registering the device key answers. */
export class RelayDeviceKeyType {
    /** True once the device holds the key. */
    @Field(() => Boolean)
    registered!: boolean
}
