import { Field, Int, ObjectType } from "@nestjs/graphql"
import { PracticeExampleType } from "./practice-example.type"
import { PracticeHintType } from "./practice-hint.type"
import { PracticeStarterCodeType } from "./practice-starter-code.type"

@ObjectType()
/** A problem as the learner opens it: statement, examples, starter codes and opened hints; never a test or a solution. */
export class PracticeProblemType {
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

    /** The difficulty. */
    @Field(() => String)
    difficulty!: string

    /** The tags. */
    @Field(() => [String])
    tags!: ReadonlyArray<string>

    /** The statement in markdown. */
    @Field(() => String)
    statementMarkdown!: string

    /** The CPU time limit of a test in milliseconds. */
    @Field(() => Int)
    timeLimitMs!: number

    /** The memory limit of a test in kilobytes. */
    @Field(() => Int)
    memoryLimitKb!: number

    /** Whether the viewer needs Premium to run it; a locked problem answers its statement only. */
    @Field(() => Boolean)
    locked!: boolean

    /** The starter code of each language; empty when locked. */
    @Field(() => [PracticeStarterCodeType])
    starterCodes!: ReadonlyArray<PracticeStarterCodeType>

    /** The public examples; empty when locked. */
    @Field(() => [PracticeExampleType])
    examples!: ReadonlyArray<PracticeExampleType>

    /** How many steps the hint ladder has. */
    @Field(() => Int)
    hintsTotal!: number

    /** The steps the viewer opened, in order. */
    @Field(() => [PracticeHintType])
    hintsRevealed!: ReadonlyArray<PracticeHintType>

    /** How the viewer stands on it. */
    @Field(() => String)
    status!: string

    /** The slug of the next problem of the pattern, or null at the last. */
    @Field(() => String, { nullable: true })
    nextSlug!: string | null
}
