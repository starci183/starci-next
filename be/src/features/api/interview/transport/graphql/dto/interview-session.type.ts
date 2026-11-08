import { Field, Int, ObjectType } from "@nestjs/graphql"
import { InterviewSetupType } from "./interview-setup.type"
import { InterviewQuestionType } from "./interview-question.type"
import { InterviewTurnType } from "./interview-turn.type"
import { InterviewScorecardType } from "./interview-scorecard.type"
import { InterviewModuleLessonsType } from "./interview-module-lessons.type"
import { InterviewGradedByType } from "./interview-graded-by.type"

@ObjectType()
/** A session as the learner reads it. */
export class InterviewSessionType {
    /** The session id. */
    @Field(() => String)
    sessionId!: string

    /** The setup. */
    @Field(() => InterviewSetupType)
    setup!: InterviewSetupType

    /** Where it stands. */
    @Field(() => String)
    status!: string

    /** The open question. */
    @Field(() => Int)
    position!: number

    /** The questions. */
    @Field(() => [InterviewQuestionType])
    questions!: ReadonlyArray<InterviewQuestionType>

    /** Every turn in order. */
    @Field(() => [InterviewTurnType])
    turns!: ReadonlyArray<InterviewTurnType>

    /** The scorecard, only once graded. */
    @Field(() => InterviewScorecardType, { nullable: true })
    scorecard!: InterviewScorecardType | null

    /** The lessons each gap links to, only once graded. */
    @Field(() => [InterviewModuleLessonsType])
    lessons!: ReadonlyArray<InterviewModuleLessonsType>

    /** The overall score of the previous graded session on the same track and tier. */
    @Field(() => Int, { nullable: true })
    previousScore!: number | null

    /** The model that graded it. */
    @Field(() => InterviewGradedByType, { nullable: true })
    gradedBy!: InterviewGradedByType | null

    /** The code of a failed grading. */
    @Field(() => String, { nullable: true })
    failureCode!: string | null

    /** When it started. */
    @Field(() => String)
    startedAt!: string

    /** When it was graded. */
    @Field(() => String, { nullable: true })
    gradedAt!: string | null
}
