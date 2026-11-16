import { Field, Int, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** A guide in the list. */
export class HarnessGuideSummaryType {
    /** claude or codex. */
    @Field(() => String)
    tool!: string

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
