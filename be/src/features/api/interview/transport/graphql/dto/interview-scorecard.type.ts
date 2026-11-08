import { Field, Int, ObjectType } from "@nestjs/graphql"
import { InterviewAttributeType } from "./interview-attribute.type"
import { InterviewQuestionScoreType } from "./interview-question-score.type"
import { InterviewGapType } from "./interview-gap.type"

@ObjectType()
/** The scorecard of a graded session. */
export class InterviewScorecardType {
    /** 0 to 100. */
    @Field(() => Int)
    overallScore!: number

    /** pass, borderline or fail. */
    @Field(() => String)
    verdict!: string

    /** The technical pillar. */
    @Field(() => Int, { nullable: true })
    technicalScore!: number | null

    /** The technical verdict. */
    @Field(() => String, { nullable: true })
    technicalVerdict!: string | null

    /** The behavioural pillar. */
    @Field(() => Int, { nullable: true })
    behavioralScore!: number | null

    /** The behavioural verdict. */
    @Field(() => String, { nullable: true })
    behavioralVerdict!: string | null

    /** Attribute scores. */
    @Field(() => [InterviewAttributeType])
    attributes!: ReadonlyArray<InterviewAttributeType>

    /** The questions graded. */
    @Field(() => [InterviewQuestionScoreType])
    questions!: ReadonlyArray<InterviewQuestionScoreType>

    /** What went well. */
    @Field(() => [String])
    strengths!: ReadonlyArray<string>

    /** What to study again. */
    @Field(() => [InterviewGapType])
    gaps!: ReadonlyArray<InterviewGapType>
}
