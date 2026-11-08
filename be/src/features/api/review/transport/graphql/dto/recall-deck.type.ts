import { Field, Int, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** One deck of the picker. */
export class RecallDeckType {
    /** The deck id. */
    @Field(() => String)
    deckId!: string

    /** The course folder. */
    @Field(() => String)
    course!: string

    /** The title. */
    @Field(() => String)
    title!: string

    /** The description. */
    @Field(() => String)
    description!: string

    /** The difficulty. */
    @Field(() => String)
    difficulty!: string

    /** The cards. */
    @Field(() => Int)
    cardCount!: number

    /** The cards a free learner can review. */
    @Field(() => Int)
    freeCardCount!: number

    /** Whether the learner added the deck. */
    @Field(() => Boolean)
    added!: boolean

    /** The outcome tracks that use the deck. */
    @Field(() => [String])
    track!: ReadonlyArray<string>
}
