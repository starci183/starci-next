import { Field, Int, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** The scores of one track and tier over time. */
export class InterviewTrendType {
    /** The track. */
    @Field(() => String)
    track!: string

    /** The tier. */
    @Field(() => String)
    tier!: string

    /** Scores, oldest first. */
    @Field(() => [Int])
    scores!: ReadonlyArray<number>
}
