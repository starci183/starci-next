import { Field, Float, Int, ObjectType } from "@nestjs/graphql"
import { LessonAttemptCriterionResultType } from "./lesson-attempt-criterion-result.type"
import { LessonAttemptOptionResultType } from "./lesson-attempt-option-result.type"

@ObjectType()
/** The demo code a right opener pick releases: lines of the lesson's source, their file and what to look at. */
export class LessonAttemptInsightCodeType {
    /** The path inside the lesson folder. */
    @Field(() => String)
    file!: string

    /** The language of the lines (`ts`, `lua`). */
    @Field(() => String)
    lang!: string

    /** The number of the first line in the file. */
    @Field(() => Int)
    start!: number

    /** The key lines, numbered as in the file. */
    @Field(() => [Int])
    highlight!: ReadonlyArray<number>

    /** The lines, as written in the file. */
    @Field(() => String)
    code!: string

    /** One line on what to look at. */
    @Field(() => String)
    note!: string
}

@ObjectType()
/** One row of the walk-through table (Đi từng bước). */
export class LessonAttemptInsightStepType {
    /** Who acts; empty when the row names no one. */
    @Field(() => String)
    who!: string

    /** What happens. */
    @Field(() => String)
    text!: string

    /** True for the faulty step. */
    @Field(() => Boolean)
    isFault!: boolean

    /** The third-column cell (what the insight's `stateLabel` names), or null for a two-column table. */
    @Field(() => String, { nullable: true })
    state?: string | null

    /** The label of the group of rows this step starts, or null when it continues the current group. */
    @Field(() => String, { nullable: true })
    group?: string | null
}

@ObjectType()
/** The interview answer in four beats. */
export class LessonAttemptInterviewBeatsType {
    @Field(() => String)
    symptom!: string

    @Field(() => String)
    cause!: string

    @Field(() => String)
    fix!: string

    @Field(() => String)
    cost!: string
}

@ObjectType()
/** The explanation a right opener pick releases: Vì sao, Xem kỹ thuật and Nói gọn. */
export class LessonAttemptInsightType {
    /** Nói gọn: the essence the question tests. */
    @Field(() => String)
    essence!: string

    /** The prose of Xem kỹ thuật after the walk-through table; may be empty. */
    @Field(() => String)
    why!: string

    /** Trả lời phỏng vấn: a model interview answer. */
    @Field(() => String)
    interview!: string

    /** Anh Senior's everyday picture of the fault, or null. */
    @Field(() => String, { nullable: true })
    analogy?: string | null

    /** The paragraph that names the term(s), `**bold**` spans marking each, or null. */
    @Field(() => String, { nullable: true })
    term?: string | null

    /** The header of the walk-through table's third column, or null for a two-column table. */
    @Field(() => String, { nullable: true })
    stateLabel?: string | null

    /** The figure of the question as Mermaid text (sequence, flowchart or state diagram), or null when it ships none. */
    @Field(() => String, { nullable: true })
    diagram?: string | null

    /** The one line that says where to look in the figure, or null. */
    @Field(() => String, { nullable: true })
    diagramCaption?: string | null

    /** Đi từng bước: the rows of the walk-through table, grouped, the faulty one marked; null for an opener without one. */
    @Field(() => [LessonAttemptInsightStepType], { nullable: true })
    happened?: ReadonlyArray<LessonAttemptInsightStepType> | null

    /** Cách sửa bằng lời thường, or null. */
    @Field(() => String, { nullable: true })
    fix?: string | null

    /** Lưu ý: the cost of the fix, or null. */
    @Field(() => String, { nullable: true })
    cost?: string | null

    /** The interview answer in four beats, or null for an older opener. */
    @Field(() => LessonAttemptInterviewBeatsType, { nullable: true })
    interviewBeats?: LessonAttemptInterviewBeatsType | null

    /** The demo code of the question, or null when it ships none. */
    @Field(() => LessonAttemptInsightCodeType, { nullable: true })
    code?: LessonAttemptInsightCodeType | null
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
