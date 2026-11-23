import { Field, ObjectType } from "@nestjs/graphql"
import { LessonOpenerStoryType, LessonQuestionType } from "./lesson-question.type"
import { LessonArchitectureType, LessonCodeWalkType, LessonSourceType } from "./lesson-source.type"
import { LessonChallengeType, LessonScenarioType } from "./lesson-scenario.type"
import { LessonStatementType } from "./lesson-statement.type"
import { LessonBugPackType, LessonPatternType } from "./lesson-bugs.type"

@ObjectType()
/** One glossary term of the Bản chất reading: the words as the prose writes them and what they mean. */
export class LessonReadingTermType {
    /** The stable id. */
    @Field(() => String)
    id!: string

    /** The term as the prose writes it. */
    @Field(() => String)
    term!: string

    /** What it means, one sentence. */
    @Field(() => String)
    definition!: string
}

@ObjectType()
/** One self-check of the reading: the question and its choice words; the key and the reasons come only with the grade of a pick. */
export class LessonReadingCheckType extends LessonQuestionType {
    /** The `## N.` chapter it closes. */
    @Field(() => String)
    chapter!: string
}

@ObjectType()
/** The glossary and the self-checks of the Bản chất reading. */
export class LessonReadingType {
    /** The terms the reading explains in its margin. */
    @Field(() => [LessonReadingTermType])
    glossary!: ReadonlyArray<LessonReadingTermType>

    /** The self-checks, one closing each chapter that has one. */
    @Field(() => [LessonReadingCheckType])
    checks!: ReadonlyArray<LessonReadingCheckType>
}

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

    /** The Bản chất reading's glossary and self-checks, or null (a lesson without them, or Bản chất is locked). */
    @Field(() => LessonReadingType, { nullable: true })
    reading!: LessonReadingType | null
}
