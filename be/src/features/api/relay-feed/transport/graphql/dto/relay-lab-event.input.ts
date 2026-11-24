import { Field, InputType, Int } from "@nestjs/graphql"
import {
    ArrayMaxSize,
    IsArray,
    IsBoolean,
    IsIn,
    IsInt,
    IsOptional,
    IsString,
    Matches,
    Max,
    MaxLength,
    Min,
    ValidateNested,
} from "class-validator"
import { Type } from "class-transformer"
import { RelayEventBaseInput } from "./relay-event.input"

const SAFE_NAME = /^[A-Za-z0-9._:-]+$/u
const HEX_40 = /^[0-9a-f]{40}$/u

@InputType()
/** The boot stage a lab reports (`lab.boot`). */
export class RelayLabBootInput extends RelayEventBaseInput {
    /** machine, clone, compose, seed or first-run. */
    @Field(() => String)
    @IsIn(["machine", "clone", "compose", "seed", "first-run"])
    stage!: string

    /** running, done or failed. */
    @Field(() => String)
    @IsIn(["running", "done", "failed"])
    status!: string

    /** A short line about the stage, 300 characters at most. */
    @Field(() => String)
    @IsString()
    @MaxLength(300)
    detail!: string

    /** How long the stage ran, in milliseconds. */
    @Field(() => Int)
    @IsInt()
    @Min(0)
    @Max(86_400_000)
    durationMs!: number
}

@InputType()
/** One visible test result of a run. */
export class RelayLabTestInput {
    /** The test id. */
    @Field(() => String)
    @IsString()
    @MaxLength(100)
    @Matches(SAFE_NAME)
    id!: string

    /** The test name. */
    @Field(() => String)
    @IsString()
    @MaxLength(300)
    name!: string

    /** Whether it passed. */
    @Field(() => Boolean)
    @IsBoolean()
    passed!: boolean

    /** How long it ran, in milliseconds. */
    @Field(() => Int)
    @IsInt()
    @Min(0)
    @Max(86_400_000)
    durationMs!: number

    /** The failure message, 1000 characters at most; empty when it passed. */
    @Field(() => String)
    @IsString()
    @MaxLength(1000)
    message!: string
}

@InputType()
/** One run of the visible tests (`lab.tests`). */
export class RelayLabTestsInput extends RelayEventBaseInput {
    /** The commit the run was on (40 hex). */
    @Field(() => String)
    @IsString()
    @Matches(HEX_40)
    commit!: string

    /** The chaos switches that were on. */
    @Field(() => [String])
    @IsArray()
    @ArrayMaxSize(20)
    @IsString({ each: true })
    @MaxLength(100, { each: true })
    @Matches(SAFE_NAME, { each: true })
    chaosOn!: Array<string>

    /** The results, 200 at most. */
    @Field(() => [RelayLabTestInput])
    @IsArray()
    @ArrayMaxSize(200)
    @ValidateNested({ each: true })
    @Type(() => RelayLabTestInput)
    tests!: Array<RelayLabTestInput>
}

@InputType()
/** One mirrored file. */
export class RelayLabFileInput {
    /** The path, one of the manifest's files. */
    @Field(() => String)
    @IsString()
    @MaxLength(300)
    path!: string

    /** The SHA-256 (hex) of the file bytes. */
    @Field(() => String)
    @IsString()
    @Matches(/^[0-9a-f]{64}$/u)
    sha256!: string

    /** The text, 64 KiB at most; null when the file is larger. */
    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    @MaxLength(65_536)
    text?: string | null
}

@InputType()
/** The learner's files at a commit (`lab.files`). */
export class RelayLabFilesInput extends RelayEventBaseInput {
    /** The commit they were read at (40 hex). */
    @Field(() => String)
    @IsString()
    @Matches(HEX_40)
    commit!: string

    /** The files, 40 at most. */
    @Field(() => [RelayLabFileInput])
    @IsArray()
    @ArrayMaxSize(40)
    @ValidateNested({ each: true })
    @Type(() => RelayLabFileInput)
    files!: Array<RelayLabFileInput>
}

@InputType()
/** The signed result of a grading run on the learner's clean checkout (`lab.grade`). */
export class RelayLabGradeInput extends RelayEventBaseInput {
    /** The submission graded. */
    @Field(() => String)
    @IsString()
    @MaxLength(36)
    submissionId!: string

    /** The nonce of the grade manifest (64 hex). */
    @Field(() => String)
    @IsString()
    @Matches(/^[0-9a-f]{64}$/u)
    nonce!: string

    /** The learner's committed sha the run was on (40 hex). */
    @Field(() => String)
    @IsString()
    @MaxLength(64)
    commit!: string

    /** One result per hidden test id. */
    @Field(() => [RelayLabTestInput])
    @IsArray()
    @ArrayMaxSize(200)
    @ValidateNested({ each: true })
    @Type(() => RelayLabTestInput)
    tests!: Array<RelayLabTestInput>

    /** Set when the device could not grade (no-readable-report, uncommitted, run-failed, lab-not-found): the submission ends with it, and no test. */
    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsIn(["no-readable-report", "uncommitted", "run-failed", "lab-not-found"])
    failure?: string | null

    /** The base64 Ed25519 signature of the canonical JSON of `{submissionId, nonce, commit, tests, failure?}`. */
    @Field(() => String)
    @IsString()
    @MaxLength(200)
    signature!: string
}
