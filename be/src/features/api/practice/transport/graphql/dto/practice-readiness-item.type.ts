import { Field, Int, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** The readiness of a learner in one pattern. */
export class PracticeReadinessItemType {
    /** The pattern id. */
    @Field(() => String)
    patternId!: string

    /** The title in the asked locale. */
    @Field(() => String)
    title!: string

    /** How many live problems the pattern has. */
    @Field(() => Int)
    problemCount!: number

    /** How many of them the learner got accepted. */
    @Field(() => Int)
    acceptedCount!: number
}
