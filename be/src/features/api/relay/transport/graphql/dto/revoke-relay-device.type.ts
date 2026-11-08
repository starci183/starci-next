import { Field, ID, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** The revoked device. */
export class RevokeRelayDeviceType {
    /** The device id that no longer works. */
    @Field(() => ID)
    id!: string
}
