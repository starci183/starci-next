import { Field, Int, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** One session in the history. */
export class InterviewHistoryItemType {
    /** The session id. */
    @Field(() => String)
    sessionId!: string

    /** The track. */
    @Field(() => String)
    track!: string

    /** The tier. */
    @Field(() => String)
    tier!: string

    /** When it started. */
    @Field(() => String)
    startedAt!: string

    /** The status. */
    @Field(() => String)
    status!: string

    /** The score once graded. */
    @Field(() => Int, { nullable: true })
    overallScore!: number | null

    /** The verdict once graded. */
    @Field(() => String, { nullable: true })
    verdict!: string | null
}
