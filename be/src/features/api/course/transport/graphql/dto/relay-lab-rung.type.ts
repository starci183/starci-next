import { Field, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** One ladder rung of the learner file, served as a single file (never a tarball, never the whole ladder). */
export class RelayLabRungType {
    /** `rung:<tag>`. */
    @Field(() => String)
    kind!: string

    /** The rung's tag. */
    @Field(() => String)
    tag!: string

    /** The learner file's path in the lab. */
    @Field(() => String)
    path!: string

    /** The file's text at that rung. */
    @Field(() => String)
    content!: string

    /** The SHA-256 (hex) of the text's UTF-8 bytes. */
    @Field(() => String)
    sha256!: string
}
