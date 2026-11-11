import { Field, Int, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** One review a finished lesson opened: the retrieval asked again 1, 7 or 21 days after completion. */
export class LessonProgressReviewType {
    /** The retrieval activity. */
    @Field(() => String)
    activityId!: string

    /** The days after completion. */
    @Field(() => Int)
    afterDays!: number

    /** The day it falls due, YYYY-MM-DD. */
    @Field(() => String)
    dueOn!: string

    /** Whether the learner finished it. */
    @Field(() => Boolean)
    done!: boolean
}
