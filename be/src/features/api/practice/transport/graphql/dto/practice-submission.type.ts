import { Field, Int, ObjectType } from "@nestjs/graphql"
import { PracticeTestSummaryType } from "./practice-test-summary.type"

@ObjectType()
/** A run or submit of a learner and where its judging stands. */
export class PracticeSubmissionType {
    /** The submission id. */
    @Field(() => String)
    id!: string

    /** The problem slug. */
    @Field(() => String)
    slug!: string

    /** The language. */
    @Field(() => String)
    language!: string

    /** Run or submit. */
    @Field(() => String)
    kind!: string

    /** Where the submission stands; QUEUED and RUNNING mean poll again. */
    @Field(() => String)
    verdict!: string

    /** The compiler output of a compile error, or null. */
    @Field(() => String, { nullable: true })
    compileOutput!: string | null

    /** The stable code of an internal error (judge not configured or unavailable), or null. */
    @Field(() => String, { nullable: true })
    failureCode!: string | null

    /** The summary of each test judged. */
    @Field(() => [PracticeTestSummaryType])
    tests!: ReadonlyArray<PracticeTestSummaryType>

    /** How many tests passed. */
    @Field(() => Int)
    passedCount!: number

    /** How many tests the submission has. */
    @Field(() => Int)
    totalCount!: number

    /** The slowest test time in milliseconds, or null. */
    @Field(() => Int, { nullable: true })
    timeMs!: number | null

    /** The highest memory in kilobytes, or null. */
    @Field(() => Int, { nullable: true })
    memoryKb!: number | null

    /** When the submission was made, an ISO instant. */
    @Field(() => String)
    createdAt!: string
}
