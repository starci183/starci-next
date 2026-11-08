import { Field, InputType, Int } from "@nestjs/graphql"
import { IsBoolean, IsInt, IsOptional, IsString, IsUUID, Matches, Max, MaxLength, Min } from "class-validator"

const SAFE_ID = /^[A-Za-z0-9._:/-]+$/u

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

    /** test, e2e or probe, when the project names one. */
    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    @MaxLength(5)
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
