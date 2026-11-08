import { Field, ObjectType } from "@nestjs/graphql"

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

    /** True when the item needs Premium and the learner holds none. */
    @Field(() => Boolean)
    locked!: boolean

    /** The due day, yyyy-mm-dd. */
    @Field(() => String)
    dueOn!: string
}
