import { Field, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** One short fact of a result, for the text of the screen. */
export class ProjectFactType {
    /** The key. */
    @Field(() => String)
    key!: string

    /** The value as text. */
    @Field(() => String)
    value!: string
}
