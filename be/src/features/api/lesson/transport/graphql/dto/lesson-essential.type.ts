import { Field, ObjectType } from "@nestjs/graphql"
import { LessonQuestionType } from "./lesson-question.type"
import { LessonArchitectureType, LessonCodeWalkType, LessonSourceType } from "./lesson-source.type"
import { LessonChallengeType, LessonScenarioType } from "./lesson-scenario.type"
import { LessonStatementType } from "./lesson-statement.type"

@ObjectType()
/**
 * The four parts of a lesson. A part the entitlement setting leaves free is filled for everyone (by default the opener and the
 * article of Bản chất); the others are empty without Premium and named in `lockedParts`.
 */
export class LessonEssentialType {
    /** True when at least one part is locked for the learner. */
    @Field(() => Boolean)
    isLocked!: boolean

    /** The ids of the parts the learner may not read: `1-essential`, `2-source`, `3-scenarios`, `4-apply`. */
    @Field(() => [String])
    lockedParts!: ReadonlyArray<string>

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
