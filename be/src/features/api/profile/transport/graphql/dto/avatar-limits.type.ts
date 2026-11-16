import { Field, Int, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** The limits an avatar is held to. */
export class AvatarLimitsType {
    /** The largest avatar in bytes. */
    @Field(() => Int)
    maxBytes!: number

    /** The content types admitted. */
    @Field(() => [String])
    contentTypes!: Array<string>

    /** The longest display name in characters. */
    @Field(() => Int)
    nameMax!: number
}
