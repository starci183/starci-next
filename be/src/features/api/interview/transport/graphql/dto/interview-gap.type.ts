import { Field, Int, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** One thing to study again. */
export class InterviewGapType {
    /** What the answer missed. */
    @Field(() => String)
    text!: string

    /** The question position. */
    @Field(() => Int)
    position!: number

    /** The module slugs of the bank. */
    @Field(() => [String])
    moduleRefs!: ReadonlyArray<string>
}
