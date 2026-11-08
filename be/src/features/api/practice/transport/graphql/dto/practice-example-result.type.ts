import { Field, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** What a run shows of the public example it executed. */
export class PracticeExampleResultType {
    /** The standard input of the example. */
    @Field(() => String)
    input!: string

    /** The expected output. */
    @Field(() => String)
    expected!: string

    /** What the program printed. */
    @Field(() => String)
    actual!: string
}
