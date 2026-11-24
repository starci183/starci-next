import { Field, Int, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** One boot stage of a lab. */
export class CourseLabBootType {
    /** machine, clone, compose, seed or first-run. */
    @Field(() => String)
    stage!: string

    /** running, done or failed. */
    @Field(() => String)
    status!: string

    /** A short line about the stage. */
    @Field(() => String)
    detail!: string

    /** How long the stage ran, in milliseconds. */
    @Field(() => Int)
    durationMs!: number

    /** When the stage was reported, ISO 8601. */
    @Field(() => String)
    at!: string
}

@ObjectType()
/** A text of the lab in both languages of the app. */
export class CourseLabTextType {
    /** Vietnamese. */
    @Field(() => String)
    vi!: string

    /** English. */
    @Field(() => String)
    en!: string
}

@ObjectType()
/** One visible test with the result of the last run. */
export class CourseLabTestType {
    /** The test id. */
    @Field(() => String)
    id!: string

    /** The test name, in both languages. */
    @Field(() => CourseLabTextType)
    name!: CourseLabTextType

    /** Whether it passed in the last run; null when none ran. */
    @Field(() => Boolean, { nullable: true })
    passed!: boolean | null

    /** How long it ran in the last run; null when none ran. */
    @Field(() => Int, { nullable: true })
    durationMs!: number | null

    /** The failure message of the last run; null when it passed or none ran. */
    @Field(() => String, { nullable: true })
    message!: string | null
}

@ObjectType()
/** One file of the lab the learner's machine last synced. */
export class CourseLabFileType {
    /** The path. */
    @Field(() => String)
    path!: string

    /** The text; null when the file is larger than 64 KiB. */
    @Field(() => String, { nullable: true })
    text!: string | null

    /** The SHA-256 (hex) of the file bytes. */
    @Field(() => String)
    sha256!: string
}

@ObjectType()
/** The newest log lines of one service of the lab. */
export class CourseLabLogType {
    /** The service. */
    @Field(() => String)
    service!: string

    /** The last 200 lines at most, oldest first. */
    @Field(() => [String])
    lines!: ReadonlyArray<string>
}

@ObjectType()
/** One chaos switch of the lab. */
export class CourseLabChaosType {
    /** The switch id. */
    @Field(() => String)
    id!: string

    /** The label the learner reads, in both languages. */
    @Field(() => CourseLabTextType)
    label!: CourseLabTextType
}

@ObjectType()
/** The steps and the faults of the hidden grader matrix: a cell is one fault injected at one step. */
export class CourseLabMatrixType {
    /** The step ids, in the order the grid draws its rows. */
    @Field(() => [String])
    steps!: ReadonlyArray<string>

    /** The fault ids, in the order the grid draws its columns. */
    @Field(() => [String])
    faults!: ReadonlyArray<string>
}

@ObjectType()
/** The verdict of one hidden test of a graded submission: its id and whether it passed, never what the test says. */
export class CourseLabSubmissionTestType {
    /** The hidden test id. */
    @Field(() => String)
    id!: string

    /** Whether it passed. */
    @Field(() => Boolean)
    passed!: boolean
}

@ObjectType()
/** The newest submission of the lab: graded on the learner's machine, practice level. */
export class CourseLabSubmissionType {
    /** The submission id. */
    @Field(() => String)
    id!: string

    /** queued, running, graded or rejected. */
    @Field(() => String)
    status!: string

    /** True when graded and every hidden test passed. */
    @Field(() => Boolean)
    passed!: boolean

    /** The stable reason code of a rejection; null otherwise. */
    @Field(() => String, { nullable: true })
    rejectReason!: string | null

    /** The committed sha that was graded; null before it is graded. */
    @Field(() => String, { nullable: true })
    commit!: string | null

    /** The hidden test verdicts once graded; empty before. */
    @Field(() => [CourseLabSubmissionTestType])
    tests!: ReadonlyArray<CourseLabSubmissionTestType>

    /** The hints the learner opened. */
    @Field(() => Int)
    hintsOpened!: number

    /** The time the learner spent, in milliseconds. */
    @Field(() => Int)
    timeSpentMs!: number

    /** When it was submitted, ISO 8601. */
    @Field(() => String)
    createdAt!: string

    /** When it was graded or rejected, ISO 8601; null while open. */
    @Field(() => String, { nullable: true })
    gradedAt!: string | null
}

@ObjectType()
/** The lab of one lesson for the learner who asks. */
export class CourseLabType {
    /** The course. */
    @Field(() => String)
    courseId!: string

    /** The lesson. */
    @Field(() => String)
    lessonId!: string

    /** none (no paired device), offline (paired, none online) or online. */
    @Field(() => String)
    device!: string

    /** setup (nothing started), booting (stages reported) or ready (the first run is done). */
    @Field(() => String)
    phase!: string

    /** The boot stages reported, in order. */
    @Field(() => [CourseLabBootType])
    boot!: ReadonlyArray<CourseLabBootType>

    /** The visible tests with the last run's results. */
    @Field(() => [CourseLabTestType])
    tests!: ReadonlyArray<CourseLabTestType>

    /** The files last synced. */
    @Field(() => [CourseLabFileType])
    files!: ReadonlyArray<CourseLabFileType>

    /** The log tail per service. */
    @Field(() => [CourseLabLogType])
    logs!: ReadonlyArray<CourseLabLogType>

    /** The chaos switches that are on. */
    @Field(() => [String])
    chaosOn!: ReadonlyArray<string>

    /** Every chaos switch of the lab. */
    @Field(() => [CourseLabChaosType])
    chaos!: ReadonlyArray<CourseLabChaosType>

    /** When the machine last synced tests or files, ISO 8601; null before. */
    @Field(() => String, { nullable: true })
    lastSyncedAt!: string | null

    /** True when state exists and the device is not online: the files shown are the last synced ones. */
    @Field(() => Boolean)
    connectionLost!: boolean

    /** The ONE file the learner edits; null when the lab names none. */
    @Field(() => String, { nullable: true })
    learnerFile!: string | null

    /** The hidden grader matrix (steps by faults); null when the lab grades none. */
    @Field(() => CourseLabMatrixType, { nullable: true })
    matrix!: CourseLabMatrixType | null

    /** True once a submission passed: the solution tarball opens to the learner's device and the next manifest carries it. */
    @Field(() => Boolean)
    solutionUnlocked!: boolean

    /** True once a submission passed and the lab has a NestJS version: the next manifest carries it. */
    @Field(() => Boolean)
    frameworkUnlocked!: boolean

    /** The newest submission; null when none. */
    @Field(() => CourseLabSubmissionType, { nullable: true })
    latestSubmission!: CourseLabSubmissionType | null
}

@ObjectType()
/** What a lab door sent to the learner's online device. */
export class CourseLabRequestedType {
    /** The name of the device the manifest went to. */
    @Field(() => String)
    device!: string

    /** boot, test, chaos or grade. */
    @Field(() => String)
    action!: string

    /** The signed manifest id. */
    @Field(() => String)
    manifestId!: string
}

@ObjectType()
/** What a lab submission sent to the learner's online device. */
export class CourseLabSubmittedType extends CourseLabRequestedType {
    /** The submission id; its grade is read back with courseLab. */
    @Field(() => String)
    submissionId!: string
}
