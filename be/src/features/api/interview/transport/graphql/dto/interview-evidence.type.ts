import { Field, Int, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** The best graded result for one track, pillar and tier. */
export class InterviewEvidenceType {
    /** The track. */
    @Field(() => String)
    track!: string

    /** The pillar. */
    @Field(() => String)
    family!: string

    /** The tier. */
    @Field(() => String)
    tier!: string

    /** The best score. */
    @Field(() => Int)
    bestScore!: number

    /** The verdict. */
    @Field(() => String)
    verdict!: string

    /** The session. */
    @Field(() => String)
    sessionId!: string

    /** When it was graded. */
    @Field(() => String)
    gradedAt!: string
}
