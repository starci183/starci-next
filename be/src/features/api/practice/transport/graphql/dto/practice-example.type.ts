import { Field, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** One public example of a problem. */
export class PracticeExampleType {
    /** The standard input. */
    @Field(() => String)
    input!: string

    /** The expected standard output. */
    @Field(() => String)
    output!: string
}
