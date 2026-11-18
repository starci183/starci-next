import { Field, Int, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** One graded submit in the history of a learner. */
export class PracticeSubmissionItemType {
    /** The submission id. */
    @Field(() => String)
    id!: string

    /** The problem slug. */
    @Field(() => String)
    slug!: string

    /** The problem title in the asked locale. */
    @Field(() => String)
    problemTitle!: string

    /** The language. */
    @Field(() => String)
    language!: string

    /** The verdict. */
    @Field(() => String)
    verdict!: string

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
    submittedAt!: string
}
