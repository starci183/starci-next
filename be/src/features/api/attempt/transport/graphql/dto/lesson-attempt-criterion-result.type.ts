import { Field, Int, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** The grade of one rubric criterion: its level and the words of the answer that show it, never the expected evidence. */
export class LessonAttemptCriterionResultType {
    /** The criterion id. */
    @Field(() => String)
    criterionId!: string

    /** The criterion as the learner reads it. */
    @Field(() => String)
    criterion!: string

    /** 0, 1 or 2. */
    @Field(() => Int)
    level!: number

    /** The words of the answer of the learner that show the level; empty at level 0. */
    @Field(() => String)
    evidenceQuote!: string

    /** The most points the criterion gives. */
    @Field(() => Int)
    maxScore!: number
}
