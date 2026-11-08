import { Field, Float, ObjectType } from "@nestjs/graphql"
import { LessonAttemptCriterionResultType } from "./lesson-attempt-criterion-result.type"
import { LessonAttemptOptionResultType } from "./lesson-attempt-option-result.type"

@ObjectType()
/** What a graded attempt holds; the fields of the other kinds are null or empty. */
export class LessonAttemptResultType {
    /** True for a diagnostic, which does not count toward passing. */
    @Field(() => Boolean)
    isDiagnostic!: boolean

    /** For a choice, whether the pick was right. */
    @Field(() => Boolean, { nullable: true })
    correct!: boolean | null

    /** For a choice, every option with its explanation. */
    @Field(() => [LessonAttemptOptionResultType])
    options!: ReadonlyArray<LessonAttemptOptionResultType>

    /** For a simulation, whether the path reached a goal state. */
    @Field(() => Boolean, { nullable: true })
    success!: boolean | null

    /** For a simulation, the state the path reached. */
    @Field(() => String, { nullable: true })
    reachedStateId!: string | null

    /** For a written answer, the grade of each criterion in rubric order. */
    @Field(() => [LessonAttemptCriterionResultType])
    criteria!: ReadonlyArray<LessonAttemptCriterionResultType>

    /** The points earned. */
    @Field(() => Float)
    score!: number

    /** The most points possible. */
    @Field(() => Float)
    maxScore!: number
}
