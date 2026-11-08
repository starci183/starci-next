import { Field, Int, ObjectType } from "@nestjs/graphql"
import { InterviewChecklistResultType } from "./interview-checklist-result.type"
import { InterviewDimensionResultType } from "./interview-dimension-result.type"

@ObjectType()
/** The grade of one question. */
export class InterviewQuestionScoreType {
    /** The position. */
    @Field(() => Int)
    position!: number

    /** The question id. */
    @Field(() => String)
    questionId!: string

    /** The family. */
    @Field(() => String)
    family!: string

    /** Whether it was skipped. */
    @Field(() => Boolean)
    skipped!: boolean

    /** 0 to 100. */
    @Field(() => Int)
    score!: number

    /** Hints used. */
    @Field(() => Int)
    hintsUsed!: number

    /** Points taken off for hints. */
    @Field(() => Int)
    hintPenalty!: number

    /** Critical items missed. */
    @Field(() => [String])
    criticalMissed!: ReadonlyArray<string>

    /** The checklist of a technical question. */
    @Field(() => [InterviewChecklistResultType])
    checklist!: ReadonlyArray<InterviewChecklistResultType>

    /** The STAR dimensions. */
    @Field(() => [InterviewDimensionResultType])
    dimensions!: ReadonlyArray<InterviewDimensionResultType>

    /** Whether the ownership signal was weak. */
    @Field(() => Boolean)
    ownershipWeak!: boolean

    /** What the answer missed. */
    @Field(() => String)
    note!: string

    /** The teacher's ideal answer, released with the scorecard. */
    @Field(() => String)
    idealAnswer!: string
}
