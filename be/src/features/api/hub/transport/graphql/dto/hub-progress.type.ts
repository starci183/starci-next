import { Field, ObjectType, Int } from "@nestjs/graphql"

@ObjectType()
/** A line of progress. */
export class HubProgressType {
    /** The progress as text. */
    @Field(() => String)
    label!: string

    /** How far the learner is. */
    @Field(() => Int, { nullable: true })
    value!: number | null

    /** Out of how many. */
    @Field(() => Int, { nullable: true })
    total!: number | null
}
