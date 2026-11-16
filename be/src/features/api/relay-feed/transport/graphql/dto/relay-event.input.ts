import { Field, InputType, Int } from "@nestjs/graphql"
import {
    ArrayMaxSize,
    IsArray,
    IsBoolean,
    IsIn,
    IsInt,
    IsOptional,
    IsString,
    IsUUID,
    Matches,
    Max,
    MaxLength,
    Min,
} from "class-validator"

const SAFE_ID = /^[A-Za-z0-9._:/-]+$/u
const LESSON_ID = /^[a-z0-9-]+$/u

@InputType()
/** The facts every upload carries: its client event id, the task and the run. */
export class RelayEventBaseInput {
    /** The client event id (uuid); a resend of the same id stores nothing twice. */
    @Field(() => String)
    @IsUUID()
    @MaxLength(36)
    eventId!: string

    /** The task the manifest named. */
    @Field(() => String)
    @IsString()
    @MaxLength(100)
    @Matches(SAFE_ID)
    taskId!: string

    /** The run of the manifest's checks. */
    @Field(() => String)
    @IsString()
    @MaxLength(100)
    @Matches(SAFE_ID)
    runId!: string
}

@InputType()
/** A check that started. */
export class RelayCheckStartedInput extends RelayEventBaseInput {
    /** The check of the manifest. */
    @Field(() => String)
    @IsString()
    @MaxLength(100)
    @Matches(SAFE_ID)
    checkId!: string
}

@InputType()
/** The result of a check. */
export class RelayCheckResultInput extends RelayCheckStartedInput {
    /** Whether it passed. */
    @Field(() => Boolean)
    @IsBoolean()
    passed!: boolean

    /** The exit code, or -1 when it was stopped. */
    @Field(() => Int)
    @IsInt()
    @Min(-1)
    @Max(255)
    exitCode!: number

    /** How long it ran, in milliseconds. */
    @Field(() => Int)
    @IsInt()
    @Min(0)
    @Max(86_400_000)
    durationMs!: number

    /** The concept the check proves in practice, when the project names one. */
    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    @Matches(SAFE_ID)
    conceptId?: string

    /** test, e2e or probe, when the project names one; `scenario` or `challenge` for a lesson run. */
    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    @MaxLength(16)
    slot?: string

    /** The test name, e2e file or probe id. */
    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    @MaxLength(300)
    ref?: string

    /** The commit it ran on. */
    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    @MaxLength(40)
    commit?: string

    /** A lesson scenario run: the lesson slug. */
    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    @Matches(LESSON_ID)
    lessonId?: string

    /** A lesson scenario run: the scenario id (the same as the check id). */
    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    @Matches(LESSON_ID)
    scenarioId?: string

    /** A lesson scenario run: the concepts of the scenario that had a running test. */
    @Field(() => [String], { nullable: true })
    @IsOptional()
    @IsArray()
    @ArrayMaxSize(50)
    @Matches(LESSON_ID, { each: true })
    concepts?: Array<string>

    /** A lesson scenario run: the guards turned off for it. */
    @Field(() => [String], { nullable: true })
    @IsOptional()
    @IsArray()
    @ArrayMaxSize(50)
    @Matches(LESSON_ID, { each: true })
    guardsOff?: Array<string>

    /** A challenge run: the tier. */
    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsIn(["easy", "medium", "hard", "insane"])
    challengeTier?: string

    /** The first `[invariant:<id>] <hint>` failure message. */
    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    @MaxLength(300)
    why?: string

    /** The ledger lines of the run. */
    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    @MaxLength(4000)
    ledger?: string

    /** A harness-stage result: the build id (the task is harness:build:<id>). */
    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    @MaxLength(64)
    @Matches(LESSON_ID)
    buildId?: string

    /** A harness-stage result: the stage id (the check id). */
    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    @MaxLength(64)
    @Matches(LESSON_ID)
    stageId?: string

    /** A harness-stage result: the NAMES (never the values) of the key variables present on the learner machine, 16 at most. */
    @Field(() => [String], { nullable: true })
    @IsOptional()
    @IsArray()
    @ArrayMaxSize(16)
    @Matches(/^[A-Z][A-Z0-9_]{0,63}$/u, { each: true })
    envPresent?: Array<string>
}

@InputType()
/** A size-capped log chunk of a check. */
export class RelayLogInput extends RelayCheckStartedInput {
    /** The log text, 16 KiB at most. */
    @Field(() => String)
    @IsString()
    @MaxLength(16_384)
    text!: string
}

@InputType()
/** The device's acknowledgement of a pushed manifest. */
export class RelayManifestAckInput extends RelayEventBaseInput {
    /** The manifest id it took. */
    @Field(() => String)
    @IsString()
    @MaxLength(100)
    @Matches(SAFE_ID)
    manifestId!: string
}
