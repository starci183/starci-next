import { Field, Int, ObjectType } from "@nestjs/graphql"
import { LessonAttemptAnswerType } from "./lesson-attempt-answer.type"
import { LessonAttemptResultType } from "./lesson-attempt-result.type"

@ObjectType()
/** One attempt of the learner: where its grading stands and, once graded, its result. */
export class LessonAttemptType {
    /** The attempt id. */
    @Field(() => String)
    attemptId!: string

    /** The lesson. */
    @Field(() => String)
    lessonId!: string

    /** The version the learner studies. */
    @Field(() => String)
    version!: string

    /** The activity. */
    @Field(() => String)
    activityId!: string

    /** The revision of the answer to the activity. */
    @Field(() => Int)
    revision!: number

    /** What the activity asks: choice, simulation, explain or exercise. */
    @Field(() => String)
    kind!: string

    /** The phase of the activity. */
    @Field(() => String)
    phase!: string

    /** saved, grading, graded or failed. */
    @Field(() => String)
    status!: string

    /** What the learner answered, as stored. */
    @Field(() => LessonAttemptAnswerType)
    answer!: LessonAttemptAnswerType

    /** The grade once graded, otherwise null. */
    @Field(() => LessonAttemptResultType, { nullable: true })
    result!: LessonAttemptResultType | null

    /** The stable code of a failed grading, otherwise null; resending the same revision and answer grades it again. */
    @Field(() => String, { nullable: true })
    failureCode!: string | null

    /** When the answer was stored. */
    @Field(() => String)
    submittedAt!: string

    /** When the attempt was graded, otherwise null. */
    @Field(() => String, { nullable: true })
    gradedAt!: string | null
}
