import { Field, Int, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** What adding a deck did. */
export class RecallDeckAddedType {
    /** The deck id. */
    @Field(() => String)
    deckId!: string

    /** Always true. */
    @Field(() => Boolean)
    added!: boolean

    /** The cards that joined the learner. */
    @Field(() => Int)
    newCards!: number
}
