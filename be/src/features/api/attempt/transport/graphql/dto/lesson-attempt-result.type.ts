import { Field, Float, ObjectType } from "@nestjs/graphql"
import { LessonAttemptCriterionResultType } from "./lesson-attempt-criterion-result.type"
import { LessonAttemptOptionResultType } from "./lesson-attempt-option-result.type"

@ObjectType()
/** The three-part explanation a right opener pick releases. */
export class LessonAttemptInsightType {
    /** Bản chất: the essence the question tests. */
    @Field(() => String)
    essence!: string

    /** Vì sao cần: why the system needs it. */
    @Field(() => String)
    why!: string

    /** Trả lời phỏng vấn: a model interview answer. */
    @Field(() => String)
    interview!: string
}

@ObjectType()
/** What a graded attempt holds; the fields of the other kinds are null or empty. */
export class LessonAttemptResultType {
    /** True for a diagnostic, which does not count toward passing. */
    @Field(() => Boolean)
    isDiagnostic!: boolean

    /** For a choice, whether the pick was right. */
    @Field(() => Boolean, { nullable: true })
    correct!: boolean | null

    /** For a choice, every option with its explanation; for an opener question, the picked option only until the pick is right. */
    @Field(() => [LessonAttemptOptionResultType])
    options!: ReadonlyArray<LessonAttemptOptionResultType>

    /** For an opener question picked right, the three-part explanation of the right option; otherwise null. */
    @Field(() => LessonAttemptInsightType, { nullable: true })
    insight?: LessonAttemptInsightType | null

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
