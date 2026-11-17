import { Field, Int, ObjectType } from "@nestjs/graphql"
import { LessonQuestionType } from "./lesson-question.type"

@ObjectType()
/** One scenario the learner runs through the learner CLI; its result comes back over the relay. */
export class LessonScenarioType {
    /** The scenario id the CLI and the relay name. */
    @Field(() => String)
    id!: string

    /** The title. */
    @Field(() => String)
    title!: string

    /** The fault it injects. */
    @Field(() => String)
    fault!: string

    /** The command to run. */
    @Field(() => String)
    command!: string

    /** What a correct system prints. */
    @Field(() => String)
    expected!: string

    /** The invariant id it judges. */
    @Field(() => String)
    invariant!: string

    /** The guards the learner may switch off. */
    @Field(() => [String])
    guards!: ReadonlyArray<string>

    /** The hint for a red run; null until the learner has a red run of the scenario or asked for it. */
    @Field(() => String, { nullable: true })
    hint!: string | null

    /** True while the scenario has a hint that stays withheld until the learner's first red run of it or `revealLessonHint`. */
    @Field(() => Boolean)
    isHintLocked!: boolean
}

@ObjectType()
/** One rubric criterion of a challenge and its points. */
export class LessonChallengeCriterionType {
    /** The criterion id. */
    @Field(() => String)
    id!: string

    /** The criterion. */
    @Field(() => String)
    criterion!: string

    /** Its points. */
    @Field(() => Int)
    points!: number

    /** Whether it is the critical one. */
    @Field(() => Boolean)
    isCritical!: boolean
}

@ObjectType()
/** One rung of the challenge ladder; its hidden scenarios are counted, never named. */
export class LessonChallengeType {
    /** The challenge id. */
    @Field(() => String)
    id!: string

    /** easy, medium, hard or insane. */
    @Field(() => String)
    level!: string

    /** The title. */
    @Field(() => String)
    title!: string

    /** The brief, markdown. */
    @Field(() => String)
    brief!: string

    /** The rubric. */
    @Field(() => [LessonChallengeCriterionType])
    rubric!: ReadonlyArray<LessonChallengeCriterionType>

    /** How many hidden scenarios judge it. */
    @Field(() => Int)
    hiddenScenarios!: number

    /** The essence check. */
    @Field(() => [LessonQuestionType])
    questions!: ReadonlyArray<LessonQuestionType>
}
