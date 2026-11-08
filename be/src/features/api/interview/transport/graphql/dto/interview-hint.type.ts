import { Field, Int, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** A hint given. */
export class InterviewHintType {
    /** The turn id. */
    @Field(() => String)
    turnId!: string

    /** The hint. */
    @Field(() => String)
    text!: string

    /** Hints used. */
    @Field(() => Int)
    hintsUsed!: number

    /** Hints left. */
    @Field(() => Int)
    hintsLeft!: number
}
