import { Field, ObjectType } from "@nestjs/graphql"
import { AvatarLimitsType } from "./avatar-limits.type"
import { AvatarUploadHeaderType } from "./avatar-upload-header.type"

@ObjectType()
/** A signed upload of an avatar straight to the object store. */
export class AvatarUploadType {
    /** The storage key the upload goes to; sent back to confirm it. */
    @Field(() => String)
    key!: string

    /** The HTTP method of the upload, PUT. */
    @Field(() => String)
    method!: string

    /** The signed address to send the bytes to. */
    @Field(() => String)
    url!: string

    /** The headers the upload must carry unchanged. */
    @Field(() => [AvatarUploadHeaderType])
    headers!: Array<AvatarUploadHeaderType>

    /** When the signed address stops working, ISO 8601. */
    @Field(() => String)
    expiresAt!: string

    /** The limits the upload is held to. */
    @Field(() => AvatarLimitsType)
    limits!: AvatarLimitsType
}
