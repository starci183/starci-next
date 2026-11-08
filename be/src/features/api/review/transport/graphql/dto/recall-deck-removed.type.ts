import { Field, Int, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** What removing a deck did. */
export class RecallDeckRemovedType {
    /** The deck id. */
    @Field(() => String)
    deckId!: string

    /** Always false. */
    @Field(() => Boolean)
    added!: boolean

    /** The items suspended. */
    @Field(() => Int)
    suspended!: number
}
