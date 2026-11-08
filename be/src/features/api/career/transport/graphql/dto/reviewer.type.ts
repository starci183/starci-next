import { Field, Int, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** One reviewer appointment. */
export class ReviewerType {
    /** The reviewer's provider subject. */
    @Field(() => String)
    reviewerId!: string

    /** The parts the reviewer may sign. */
    @Field(() => [String])
    parts!: ReadonlyArray<string>

    /** The most open items at once. */
    @Field(() => Int)
    capacity!: number

    /** The learners the reviewer must not review. */
    @Field(() => [String])
    conflicts!: ReadonlyArray<string>

    /** When appointed. */
    @Field(() => String)
    appointedAt!: string

    /** When ended, or null while active. */
    @Field(() => String, { nullable: true })
    endedAt!: string | null

    /** How many pending items are assigned to the reviewer. */
    @Field(() => Int)
    openItems!: number
}
