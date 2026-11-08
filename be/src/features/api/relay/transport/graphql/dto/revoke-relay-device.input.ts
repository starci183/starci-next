import { Field, ID, InputType } from "@nestjs/graphql"
import { IsUUID, MaxLength } from "class-validator"

@InputType()
/** The revokeRelayDevice arguments: the device id. */
export class RevokeRelayDeviceInput {
    /** The device to revoke. */
    @Field(() => ID)
    @IsUUID()
    @MaxLength(36)
    id!: string
}
