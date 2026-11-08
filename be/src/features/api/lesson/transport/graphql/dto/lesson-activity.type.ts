import { Field, ObjectType } from "@nestjs/graphql"
import { LessonCriterionType } from "./lesson-criterion.type"
import { LessonExerciseType } from "./lesson-exercise.type"
import { LessonOptionType } from "./lesson-option.type"
import { LessonSimulationType } from "./lesson-simulation.type"

@ObjectType()
/** An activity as the learner sees it before a submit. */
export class LessonActivityType {
    /** The stable id. */
    @Field(() => String)
    id!: string

    /** What the activity asks. */
    @Field(() => String)
    kind!: string

    /** The question. */
    @Field(() => String)
    prompt!: string

    /** The shape of the answer, or null. */
    @Field(() => String, { nullable: true })
    responseKind!: string | null

    /** deterministic or ai-rubric, or null. */
    @Field(() => String, { nullable: true })
    evaluationMethod!: string | null

    /** Whether the activity is a diagnostic. */
    @Field(() => Boolean)
    isDiagnostic!: boolean

    /** The outcomes the activity trains. */
    @Field(() => [String])
    outcomeIds!: ReadonlyArray<string>

    /** The criteria names. */
    @Field(() => [LessonCriterionType])
    criteria!: ReadonlyArray<LessonCriterionType>

    /** The options. */
    @Field(() => [LessonOptionType])
    options!: ReadonlyArray<LessonOptionType>

    /** The simulation, or null. */
    @Field(() => LessonSimulationType, { nullable: true })
    simulation!: LessonSimulationType | null

    /** The exercise, or null. */
    @Field(() => LessonExerciseType, { nullable: true })
    exercise!: LessonExerciseType | null
}
