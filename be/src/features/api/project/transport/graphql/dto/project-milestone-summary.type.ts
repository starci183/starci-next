import { Field, Int, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** A milestone as a pill of the project page. */
export class ProjectMilestoneSummaryType {
    /** The milestone id. */
    @Field(() => String)
    id!: string

    /** The title in the locale of the request. */
    @Field(() => String)
    title!: string

    /** How many concepts it lists. */
    @Field(() => Int)
    conceptCount!: number

    /** How many of them are proved in this project. */
    @Field(() => Int)
    provedCount!: number

    /** nothing yet, in-progress or done. */
    @Field(() => String)
    state!: string

    /** True when opening it needs Premium and the learner has none. */
    @Field(() => Boolean)
    locked!: boolean
}
