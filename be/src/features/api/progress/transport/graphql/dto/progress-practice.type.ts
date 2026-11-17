import { Field, Int, ObjectType } from "@nestjs/graphql"
import { ProgressPracticePatternType } from "./progress-practice-pattern.type"

@ObjectType()
/** The Practice section of the progress page. */
export class ProgressPracticeType {
    /** Problems accepted across every pattern. */
    @Field(() => Int)
    acceptedCount!: number

    /** Problems across every pattern. */
    @Field(() => Int)
    problemCount!: number

    /** Patterns with some problem accepted and some not. */
    @Field(() => Int)
    patternsInProgress!: number

    /** Patterns with every problem accepted. */
    @Field(() => Int)
    patternsDone!: number

    /** The patterns in catalog order. */
    @Field(() => [ProgressPracticePatternType])
    patterns!: Array<ProgressPracticePatternType>
}
