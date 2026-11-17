import { Field, Int, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** The problem to do next: the first one the learner has not got accepted. */
export class PracticeNextProblemType {
    /** The problem slug. */
    @Field(() => String)
    slug!: string

    /** The title in the asked locale. */
    @Field(() => String)
    title!: string

    /** The pattern id. */
    @Field(() => String)
    patternId!: string

    /** The title of the pattern in the asked locale. */
    @Field(() => String)
    patternTitle!: string

    /** The 1-based position of the problem inside its pattern. */
    @Field(() => Int)
    position!: number

    /** How many problems the pattern has. */
    @Field(() => Int)
    patternProblemCount!: number
}
