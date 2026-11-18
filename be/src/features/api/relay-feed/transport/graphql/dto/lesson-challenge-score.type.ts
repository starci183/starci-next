import { Field, Int, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** One rubric criterion of a rung with the points it earned. */
export class LessonChallengeCriterionScoreType {
    /** The criterion id. */
    @Field(() => String)
    id!: string

    /** The points it is worth. */
    @Field(() => Int)
    points!: number

    /** The points it earned: all of them or none. */
    @Field(() => Int)
    earned!: number

    /** Whether it is the critical one. */
    @Field(() => Boolean)
    isCritical!: boolean

    /** Whether it passed. */
    @Field(() => Boolean)
    passed!: boolean
}

@ObjectType()
/** The score of one rung of a lesson's challenge ladder. */
export class LessonChallengeScoreType {
    /** The challenge id. */
    @Field(() => String)
    challengeId!: string

    /** easy, medium, hard or insane. */
    @Field(() => String)
    level!: string

    /** locked, open, doing or passed. */
    @Field(() => String)
    state!: string

    /** The points earned out of `maxScore`. */
    @Field(() => Int)
    score!: number

    /** The points the rubric is worth (100). */
    @Field(() => Int)
    maxScore!: number

    /** True while the tier below is not passed: a run is refused with RELAY_CHALLENGE_LOCKED. */
    @Field(() => Boolean)
    isLocked!: boolean

    /** True when every hidden scenario of the rung is green: the back end's rule that opens the next rung. */
    @Field(() => Boolean)
    isPassed!: boolean

    /** True when the next rung opens from this one. */
    @Field(() => Boolean)
    unlocksNext!: boolean

    /** The hidden scenarios that are green. */
    @Field(() => Int)
    hiddenGreen!: number

    /** The hidden scenarios that judge the rung. */
    @Field(() => Int)
    hiddenTotal!: number

    /** True when every critical criterion earned its points. */
    @Field(() => Boolean)
    isCriticalMet!: boolean

    /** Each criterion with what it earned. */
    @Field(() => [LessonChallengeCriterionScoreType])
    criteria!: ReadonlyArray<LessonChallengeCriterionScoreType>
}
