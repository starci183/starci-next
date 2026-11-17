import { Field, InputType } from "@nestjs/graphql"
import {
    ArrayMaxSize,
    IsArray,
    IsBoolean,
    IsIn,
    IsOptional,
    IsString,
    IsUUID,
    Matches,
    MaxLength,
    ValidateNested,
} from "class-validator"
import { Type } from "class-transformer"

const SLUG = /^[a-z0-9][a-z0-9-]{0,63}$/u
const CODE = /^[a-z0-9][a-z0-9._-]{0,63}$/u

@InputType()
/** One shortcut a trial observed: its kind and whether the agent call was refused. */
export class RelayHarnessShortcutInput {
    /** The shortcut kind (no-verify, test-edit, env-read, write-outside, commit-red). */
    @Field(() => String)
    @IsString()
    @MaxLength(64)
    @Matches(CODE)
    kind!: string

    /** Whether the agent tool call was refused or the repo state is unchanged. */
    @Field(() => Boolean)
    @IsBoolean()
    blocked!: boolean
}

@InputType()
/** A harness trial or doctor result of the learner machine: no prompt, command text, path, key or cost is in it. */
export class RelayHarnessResultInput {
    /** The client event id (uuid); a resend stores nothing twice. */
    @Field(() => String)
    @IsUUID()
    @MaxLength(36)
    eventId!: string

    /** harness-trial or harness-doctor. */
    @Field(() => String)
    @IsIn(["harness-trial", "harness-doctor"])
    kind!: string

    /** The tool: claude or codex. */
    @Field(() => String)
    @IsIn(["claude", "codex"])
    tool!: string

    /** A trial: the trap id. */
    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    @MaxLength(64)
    @Matches(SLUG)
    trap?: string

    /** A trial: held, breached or incomplete. */
    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsIn(["held", "breached", "incomplete"])
    verdict?: string

    /** A trial: whether the tests ended green. */
    @Field(() => Boolean, { nullable: true })
    @IsOptional()
    @IsBoolean()
    testsGreen?: boolean

    /** A trial: the shortcuts observed, 20 at most. */
    @Field(() => [RelayHarnessShortcutInput], { nullable: true })
    @IsOptional()
    @IsArray()
    @ArrayMaxSize(20)
    @ValidateNested({ each: true })
    @Type(() => RelayHarnessShortcutInput)
    shortcuts?: Array<RelayHarnessShortcutInput>

    /** A doctor probe: the probe id. */
    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    @MaxLength(64)
    @Matches(SLUG)
    probe?: string

    /** A doctor probe: passed, failed, skipped or invalid. */
    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsIn(["passed", "failed", "skipped", "invalid"])
    status?: string

    /** A doctor probe: the stable fail code. */
    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    @MaxLength(64)
    @Matches(CODE)
    reason?: string
}
