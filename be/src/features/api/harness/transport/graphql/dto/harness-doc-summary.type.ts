import { Field, Int, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** A doc in the list. */
export class HarnessDocSummaryType {
    /** The slug. */
    @Field(() => String)
    slug!: string

    /** The position. */
    @Field(() => Int)
    order!: number

    /** The title. */
    @Field(() => String)
    title!: string

    /** The summary. */
    @Field(() => String)
    summary!: string
}
