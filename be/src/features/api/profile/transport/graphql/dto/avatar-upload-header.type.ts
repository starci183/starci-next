import { Field, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** One header an avatar upload must carry unchanged. */
export class AvatarUploadHeaderType {
    /** The header name. */
    @Field(() => String)
    name!: string

    /** The header value. */
    @Field(() => String)
    value!: string
}
