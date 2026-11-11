import { Field, ObjectType } from "@nestjs/graphql"
import { LessonProgressActivityType } from "./lesson-progress-activity.type"
import { LessonProgressAttemptsType } from "./lesson-progress-attempts.type"
import { LessonProgressOutcomeType } from "./lesson-progress-outcome.type"
import { LessonProgressPhaseType } from "./lesson-progress-phase.type"
import { LessonProgressReviewType } from "./lesson-progress-review.type"
import { LessonProgressSimulationType } from "./lesson-progress-simulation.type"

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

    /** The outcomes of the lesson in its order, with their levels and their state. */
    @Field(() => [LessonProgressOutcomeType])
    outcomes!: ReadonlyArray<LessonProgressOutcomeType>

    /** The six phases in order, each open or done. */
    @Field(() => [LessonProgressPhaseType])
    phases!: ReadonlyArray<LessonProgressPhaseType>

    /** When the learner finished the lesson, or null while it is open. */
    @Field(() => String, { nullable: true })
    completedAt!: string | null

    /** The simulation positions the learner saved. */
    @Field(() => [LessonProgressSimulationType])
    simulations!: ReadonlyArray<LessonProgressSimulationType>

    /** The reviews the completion opened (1, 7 and 21 days); empty while the lesson is open. */
    @Field(() => [LessonProgressReviewType])
    reviews!: ReadonlyArray<LessonProgressReviewType>

    /** The attempts counted. */
    @Field(() => LessonProgressAttemptsType)
    attempts!: LessonProgressAttemptsType

    /** The attempts of each activity. */
    @Field(() => [LessonProgressActivityType])
    activities!: ReadonlyArray<LessonProgressActivityType>
}
