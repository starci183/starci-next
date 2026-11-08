import { Field, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** The starter code of one language. */
export class PracticeStarterCodeType {
    /** The language. */
    @Field(() => String)
    language!: string

    /** The starter code. */
    @Field(() => String)
    content!: string
}
