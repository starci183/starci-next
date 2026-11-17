import { Field, Int, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** One item of the queue. */
export class RecallItemSummaryType {
    /** The item id. */
    @Field(() => String)
    itemId!: string

    /** flashcard or retrieval. */
    @Field(() => String)
    source!: string

    /** new, learning, review, done or suspended. */
    @Field(() => String)
    status!: string

    /** The deck title of a card. */
    @Field(() => String, { nullable: true })
    deckTitle!: string | null

    /** The lesson title of a retrieval item. */
    @Field(() => String, { nullable: true })
    lessonTitle!: string | null

    /** junior, middle, senior or staff for a card. */
    @Field(() => String, { nullable: true })
    level!: string | null

    /** The due day, yyyy-mm-dd. */
    @Field(() => String)
    dueOn!: string

    /** The front of the item: a card question (cloze blanks as "____") or the retrieval question; never an answer. */
    @Field(() => String)
    question!: string

    /** direct, cloze or retrieval. */
    @Field(() => String)
    kind!: string

    /** How many times the learner already reviewed the item. */
    @Field(() => Int)
    reviewCount!: number
}
