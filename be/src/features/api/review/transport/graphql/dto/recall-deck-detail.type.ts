import { Field, Int, ObjectType } from "@nestjs/graphql"
import { RecallDeckProgressType } from "./recall-deck-progress.type"
import { RecallDeckType } from "./recall-deck.type"
import { RecallSampleCardType } from "./recall-sample-card.type"

@ObjectType()
/** One deck with sample questions, the progress of the viewer and the pace the daily goal gives. */
export class RecallDeckDetailType {
    /** The deck as the picker lists it. */
    @Field(() => RecallDeckType)
    deck!: RecallDeckType

    /** The first three cards of the deck, question text only. */
    @Field(() => [RecallSampleCardType])
    sampleCards!: ReadonlyArray<RecallSampleCardType>

    /** What the viewer has done with the deck. */
    @Field(() => RecallDeckProgressType)
    progress!: RecallDeckProgressType

    /** How many new cards of the deck the daily goal brings a day. */
    @Field(() => Int)
    estimatedNewPerDay!: number
}
