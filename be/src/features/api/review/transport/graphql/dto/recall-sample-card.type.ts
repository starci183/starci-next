import { Field, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** One card of a deck as a sample: the question only, never the answer. */
export class RecallSampleCardType {
    /** The card id. */
    @Field(() => String)
    cardId!: string

    /** direct or cloze. */
    @Field(() => String)
    kind!: string

    /** The question; a cloze blank is shown as ____. */
    @Field(() => String)
    question!: string
}
