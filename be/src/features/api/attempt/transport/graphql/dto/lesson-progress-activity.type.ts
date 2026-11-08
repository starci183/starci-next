import { Field, Int, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** The attempts of one activity: how many, and the newest. */
export class LessonProgressActivityType {
    /** The activity. */
    @Field(() => String)
    activityId!: string

    /** Its phase. */
    @Field(() => String)
    phase!: string

    /** What it asks. */
    @Field(() => String)
    kind!: string

    /** How many attempts the learner made. */
    @Field(() => Int)
    attempts!: number

    /** The newest attempt. */
    @Field(() => String)
    latestAttemptId!: string

    /** The revision of the newest attempt. */
    @Field(() => Int)
    latestRevision!: number

    /** The status of the newest attempt. */
    @Field(() => String)
    latestStatus!: string
}
