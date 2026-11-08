import { Field, Int, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** The choices of one cloze check. */
export class RecallClozeChoicesType {
    /** The cloze number. */
    @Field(() => Int)
    n!: number

    /** The term and its distractors in an order that does not reveal the term. */
    @Field(() => [String])
    choices!: ReadonlyArray<string>
}
