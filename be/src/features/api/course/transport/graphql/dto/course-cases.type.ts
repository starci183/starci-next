import { Field, Int, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** Why a run failed: the invariant that broke, and what was expected against what happened. */
export class CourseFailureType {
    /** The invariant id, or null when the run did not name one. */
    @Field(() => String, { nullable: true })
    invariant!: string | null

    /** The message the run printed. */
    @Field(() => String)
    message!: string

    /** What was expected, or null. */
    @Field(() => String, { nullable: true })
    expected!: string | null

    /** What happened, or null. */
    @Field(() => String, { nullable: true })
    actual!: string | null
}

@ObjectType()
/** The newest run of a case. */
export class CourseLastRunType {
    /** When it ran on the machine, ISO 8601. */
    @Field(() => String)
    ranAt!: string

    /** How long it took, in milliseconds. */
    @Field(() => Int)
    durationMs!: number

    /** The learner's commit it ran on, or null when git did not say. */
    @Field(() => String, { nullable: true })
    learnerCommit!: string | null

    /** Why it failed, or null when it is green. */
    @Field(() => CourseFailureType, { nullable: true })
    failed!: CourseFailureType | null
}

@ObjectType()
/** One case of the lab with where the learner stands on it. */
export class CourseCaseStateType {
    /** The case id. */
    @Field(() => String)
    caseId!: string

    /** happy or unhappy. */
    @Field(() => String)
    kind!: string

    /** locked, open, red, green or error. */
    @Field(() => String)
    status!: string

    /** Whether the case was green at least once. */
    @Field(() => Boolean)
    everGreen!: boolean

    /** How many hint levels the learner opened. */
    @Field(() => Int)
    hintsOpened!: number

    /** Whether the learner opened the case's solution ("Kẹt quá? Xem lời giải"). */
    @Field(() => Boolean)
    solutionOpened!: boolean

    /** Whether the diff against the reference is available (the case was green). */
    @Field(() => Boolean)
    diffAvailable!: boolean

    /** Whether the learner may reset to the reference step. */
    @Field(() => Boolean)
    resetAvailable!: boolean

    /** The newest run, or null when the case never ran. */
    @Field(() => CourseLastRunType, { nullable: true })
    lastRun!: CourseLastRunType | null
}

@ObjectType()
/** Every case of a lab in order, with the case to work on now. */
export class CourseCasesType {
    /** The first open case that was never green, or null when every case was. */
    @Field(() => String, { nullable: true })
    currentCaseId!: string | null

    /** Happy cases in order, then unhappy cases in order. */
    @Field(() => [CourseCaseStateType])
    cases!: ReadonlyArray<CourseCaseStateType>
}
