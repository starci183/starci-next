import { Field, Int, ObjectType } from "@nestjs/graphql"
import { PracticeExampleResultType } from "./practice-example-result.type"

@ObjectType()
/** The summary of one test; a hidden test shows no input and no expected output. */
export class PracticeTestSummaryType {
    /** The position of the test; the example is 0. */
    @Field(() => Int)
    index!: number

    /** Whether the program printed what the test expects. */
    @Field(() => Boolean)
    passed!: boolean

    /** The judge status of the test. */
    @Field(() => String)
    status!: string

    /** The CPU time in milliseconds, or null. */
    @Field(() => Int, { nullable: true })
    timeMs!: number | null

    /** The peak memory in kilobytes, or null. */
    @Field(() => Int, { nullable: true })
    memoryKb!: number | null

    /** The example with what the program printed; only for a run. */
    @Field(() => PracticeExampleResultType, { nullable: true })
    example!: PracticeExampleResultType | null
}
