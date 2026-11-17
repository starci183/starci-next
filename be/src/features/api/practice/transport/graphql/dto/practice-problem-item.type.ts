import { Field, Int, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** One problem in the list of a pattern. */
export class PracticeProblemItemType {
    /** The problem slug. */
    @Field(() => String)
    slug!: string

    /** The title in the asked locale. */
    @Field(() => String)
    title!: string

    /** The difficulty. */
    @Field(() => String)
    difficulty!: string

    /** The tags. */
    @Field(() => [String])
    tags!: ReadonlyArray<string>

    /** How the viewer stands on it. */
    @Field(() => String)
    status!: string

    /** Whether the viewer revealed the reference solution. */
    @Field(() => Boolean)
    solutionRevealed!: boolean

    /** Whether the viewer revealed the solution before the first Accepted, which keeps the problem out of experience. */
    @Field(() => Boolean)
    solutionViewedBeforeAccepted!: boolean

    /** The position inside the pattern. */
    @Field(() => Int)
    orderIndex!: number
}
