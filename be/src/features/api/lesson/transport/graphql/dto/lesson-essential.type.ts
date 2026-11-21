import { Field, ObjectType } from "@nestjs/graphql"
import { LessonOpenerStoryType, LessonQuestionType } from "./lesson-question.type"
import { LessonArchitectureType, LessonCodeWalkType, LessonSourceType } from "./lesson-source.type"
import { LessonChallengeType, LessonScenarioType } from "./lesson-scenario.type"
import { LessonStatementType } from "./lesson-statement.type"
import { LessonBugPackType, LessonPatternType } from "./lesson-bugs.type"

@ObjectType()
/**
 * The four parts of a lesson. A part the entitlement setting leaves free is filled for everyone (by default the opener and the
 * article of Bản chất); the others are empty without Premium and named in `lockedParts`.
 */
export class LessonEssentialType {
    /** True when at least one part is locked for the learner. */
    @Field(() => Boolean)
    isLocked!: boolean

    /** The ids of the parts the learner may not read: `1-essential`, `2-source`, `3-scenarios`, `4-apply`, `5-patterns`. */
    @Field(() => [String])
    lockedParts!: ReadonlyArray<string>

    /** The situation the opener tells, or null for a lesson without one. */
    @Field(() => LessonOpenerStoryType, { nullable: true })
    story!: LessonOpenerStoryType | null

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

    /** The Tìm sạn bug pack, or null (a lesson without one, or Tìm sạn is locked). */
    @Field(() => LessonBugPackType, { nullable: true })
    bugs!: LessonBugPackType | null

    /** The Pattern stacks; empty for a lesson without them or when Pattern is locked. */
    @Field(() => [LessonPatternType])
    patterns!: ReadonlyArray<LessonPatternType>
}
