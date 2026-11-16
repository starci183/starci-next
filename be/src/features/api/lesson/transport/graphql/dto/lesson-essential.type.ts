import { Field, ObjectType } from "@nestjs/graphql"
import { LessonQuestionType } from "./lesson-question.type"
import { LessonArchitectureType, LessonCodeWalkType, LessonSourceType } from "./lesson-source.type"
import { LessonChallengeType, LessonScenarioType } from "./lesson-scenario.type"
import { LessonStatementType } from "./lesson-statement.type"

@ObjectType()
/** The four parts of a lesson: the opener (free), the source, the scenarios and the challenges (Premium; empty without it). */
export class LessonEssentialType {
    /** True when the learner lacks Premium and only the opener is filled. */
    @Field(() => Boolean)
    isLocked!: boolean

    /** The five-question opener. */
    @Field(() => [LessonQuestionType])
    opener!: ReadonlyArray<LessonQuestionType>

    /** The source repository, or null. */
    @Field(() => LessonSourceType, { nullable: true })
    source!: LessonSourceType | null

    /** The invariants (`C1`...). */
    @Field(() => [LessonStatementType])
    invariants!: ReadonlyArray<LessonStatementType>

    /** The architecture, or null. */
    @Field(() => LessonArchitectureType, { nullable: true })
    architecture!: LessonArchitectureType | null

    /** The code walk. */
    @Field(() => [LessonCodeWalkType])
    codeWalk!: ReadonlyArray<LessonCodeWalkType>

    /** The scenarios. */
    @Field(() => [LessonScenarioType])
    scenarios!: ReadonlyArray<LessonScenarioType>

    /** The challenge ladder. */
    @Field(() => [LessonChallengeType])
    challenges!: ReadonlyArray<LessonChallengeType>
}
