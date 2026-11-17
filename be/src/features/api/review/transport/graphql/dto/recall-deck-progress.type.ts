import { Field, Int, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** What a learner has done with one deck; all 0 for a deck not added. */
export class RecallDeckProgressType {
    /** The cards the learner holds of the deck. */
    @Field(() => Int)
    total!: number

    /** The cards reviewed at least once. */
    @Field(() => Int)
    learned!: number

    /** The learned cards the scheduler holds in a good state. */
    @Field(() => Int)
    remembering!: number

    /** The rest of the learned cards. */
    @Field(() => Int)
    needsReview!: number
}
