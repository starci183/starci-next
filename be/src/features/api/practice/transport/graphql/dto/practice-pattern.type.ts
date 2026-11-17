import { Field, Int, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** One pattern of problems with the numbers of the viewer. */
export class PracticePatternType {
    /** The pattern id. */
    @Field(() => String)
    patternId!: string

    /** The title in the asked locale. */
    @Field(() => String)
    title!: string

    /** How many live problems the pattern has. */
    @Field(() => Int)
    problemCount!: number

    /** How many of them the viewer got accepted. */
    @Field(() => Int)
    acceptedCount!: number

    /** The paragraph that says when to use the pattern, in the asked locale; empty when the content has none. */
    @Field(() => String)
    intro!: string
}
