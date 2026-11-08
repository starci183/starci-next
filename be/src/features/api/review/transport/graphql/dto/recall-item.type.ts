import { Field, Int, ObjectType } from "@nestjs/graphql"
import { RecallClozeChoicesType } from "./recall-cloze-choices.type"

@ObjectType()
/** The public view of an item; it never holds the answer or a cloze term. */
export class RecallItemType {
    /** The item id. */
    @Field(() => String)
    itemId!: string

    /** flashcard or retrieval. */
    @Field(() => String)
    source!: string

    /** The question or retrieval prompt. */
    @Field(() => String)
    question!: string

    /** The level of a card. */
    @Field(() => String, { nullable: true })
    level!: string | null

    /** The tags. */
    @Field(() => [String])
    tags!: ReadonlyArray<string>

    /** The code languages. */
    @Field(() => [String])
    langs!: ReadonlyArray<string>

    /** The cloze checks. */
    @Field(() => [RecallClozeChoicesType])
    cloze!: ReadonlyArray<RecallClozeChoicesType>

    /** The lesson of a retrieval item. */
    @Field(() => String, { nullable: true })
    lessonId!: string | null

    /** The retrieval activity. */
    @Field(() => String, { nullable: true })
    activityId!: string | null

    /** The deck title of a card. */
    @Field(() => String, { nullable: true })
    deckTitle!: string | null

    /** The lesson title of a retrieval item. */
    @Field(() => String, { nullable: true })
    lessonTitle!: string | null

    /** The revision a grade of this item carries. */
    @Field(() => Int)
    revision!: number

    /** Whether the answer was already revealed for this revision. */
    @Field(() => Boolean)
    flipped!: boolean
}
