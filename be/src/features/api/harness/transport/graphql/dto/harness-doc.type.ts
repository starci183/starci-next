import { Field, Int, ObjectType } from "@nestjs/graphql"
import { HarnessTextType } from "./harness-text.type"

@ObjectType()
/** A doc with its sections. */
export class HarnessDocType {
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

    /** The sections. */
    @Field(() => [HarnessTextType])
    sections!: Array<HarnessTextType>

    /** The minutes a learner needs, or null. */
    @Field(() => Int, { nullable: true })
    minutes!: number | null
}
