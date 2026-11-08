import { Field, ObjectType } from "@nestjs/graphql"
import { LessonProgressActivityType } from "./lesson-progress-activity.type"
import { LessonProgressAttemptsType } from "./lesson-progress-attempts.type"
import { LessonProgressOutcomeType } from "./lesson-progress-outcome.type"

@ObjectType()
/** Where a learner stands in a lesson: the furthest phase, the outcome levels and the attempts. */
export class LessonProgressType {
    /** The lesson. */
    @Field(() => String)
    lessonId!: string

    /** The version of the newest attempt, or null before any attempt. */
    @Field(() => String, { nullable: true })
    version!: string | null

    /** The furthest phase with an attempt; the first phase before any attempt. */
    @Field(() => String)
    phase!: string

    /** The outcomes the attempts of the learner train, with their levels. */
    @Field(() => [LessonProgressOutcomeType])
    outcomes!: ReadonlyArray<LessonProgressOutcomeType>

    /** The attempts counted. */
    @Field(() => LessonProgressAttemptsType)
    attempts!: LessonProgressAttemptsType

    /** The attempts of each activity. */
    @Field(() => [LessonProgressActivityType])
    activities!: ReadonlyArray<LessonProgressActivityType>
}
