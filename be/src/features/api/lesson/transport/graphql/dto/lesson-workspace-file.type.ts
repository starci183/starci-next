import { Field, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** A workspace file of the lab. */
export class LessonWorkspaceFileType {
    /** The path. */
    @Field(() => String)
    path!: string

    /** source or test. */
    @Field(() => String)
    role!: string

    /** The file text. */
    @Field(() => String)
    content!: string
}
