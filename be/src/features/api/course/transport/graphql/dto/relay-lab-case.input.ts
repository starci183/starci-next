import { Field, InputType, Int } from "@nestjs/graphql"
import { Type } from "class-transformer"
import {
    ArrayMaxSize,
    ArrayMinSize,
    IsArray,
    IsIn,
    IsInt,
    IsOptional,
    IsString,
    IsUUID,
    Matches,
    Max,
    MaxLength,
    Min,
    ValidateNested,
} from "class-validator"
import { CASE_KINDS, CASE_MESSAGE_MAX, CASE_STATUSES, CASE_VALUE_MAX } from "@modules/platform/relay-protocol"

const SLUG = /^[a-z0-9][a-z0-9-]{0,63}$/u
const INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/u
const COMMIT = /^[0-9a-f]{40}$/u
const CHAOS_KEY = /^[A-Z][A-Z0-9_]{0,63}$/u

@InputType()
/** The queue envelope every case upload carries: the client event id and the task of the lab (`course:<course>/<lesson>`). */
export class RelayLabCaseEnvelopeInput {
    /** The client event id (uuid); a resend of the same id stores nothing twice. */
    @Field(() => String)
    @IsUUID()
    eventId!: string

    /** The task of the lab's manifests, `course:<course>/<lesson>`. */
    @Field(() => String)
    @IsString()
    @MaxLength(200)
    taskId!: string
}

@InputType()
/** One chaos switch of a case run, on the wire as key and value text. */
export class RelayLabCaseChaosInput {
    /** The switch name, upper snake case. */
    @Field(() => String)
    @IsString()
    @Matches(CHAOS_KEY)
    key!: string

    /** The switch value as text. */
    @Field(() => String)
    @IsString()
    @MaxLength(200)
    value!: string
}

@InputType()
/** How one case of a run ended. */
export class RelayLabCaseUpToInput {
    /** The case id. */
    @Field(() => String)
    @IsString()
    @Matches(SLUG)
    caseId!: string

    /** green, red or error. */
    @Field(() => String)
    @IsIn(CASE_STATUSES)
    status!: string
}

@InputType()
/** Why a case failed: the invariant that broke and the assertion's words. */
export class RelayLabCaseFailureInput {
    /** The invariant id, or null when the run did not name one. */
    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    @Matches(SLUG)
    invariant?: string | null

    /** The assertion message. */
    @Field(() => String)
    @IsString()
    @MaxLength(CASE_MESSAGE_MAX)
    message!: string

    /** What was expected. */
    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    @MaxLength(CASE_VALUE_MAX)
    expected?: string | null

    /** What happened. */
    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    @MaxLength(CASE_VALUE_MAX)
    actual?: string | null
}

@InputType()
/** `case.result`: one run of a case and every case before it. */
export class RelayLabCaseResultInput extends RelayLabCaseEnvelopeInput {
    /** The lesson. */
    @Field(() => String)
    @IsString()
    @Matches(SLUG)
    lessonId!: string

    /** The case. */
    @Field(() => String)
    @IsString()
    @Matches(SLUG)
    caseId!: string

    /** happy or unhappy. */
    @Field(() => String)
    @IsIn(CASE_KINDS)
    kind!: string

    /** green, red or error. */
    @Field(() => String)
    @IsIn(CASE_STATUSES)
    status!: string

    /** When it ran, ISO 8601 in UTC. */
    @Field(() => String)
    @IsString()
    @Matches(INSTANT)
    ranAt!: string

    /** How long it took, in milliseconds. */
    @Field(() => Int)
    @IsInt()
    @Min(0)
    @Max(86_400_000)
    durationMs!: number

    /** The commit the learner's checkout stood on (40 hex), or null when git did not say. */
    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    @Matches(COMMIT)
    learnerCommit?: string | null

    /** The chaos switches the case runs under. */
    @Field(() => [RelayLabCaseChaosInput])
    @IsArray()
    @ArrayMaxSize(50)
    @ValidateNested({ each: true })
    @Type(() => RelayLabCaseChaosInput)
    chaos!: Array<RelayLabCaseChaosInput>

    /** Every case the run covered, in teaching order, the asked case last. */
    @Field(() => [RelayLabCaseUpToInput])
    @IsArray()
    @ArrayMinSize(1)
    @ArrayMaxSize(100)
    @ValidateNested({ each: true })
    @Type(() => RelayLabCaseUpToInput)
    upTo!: Array<RelayLabCaseUpToInput>

    /** Present exactly when the status is not green. */
    @Field(() => RelayLabCaseFailureInput, { nullable: true })
    @IsOptional()
    @ValidateNested()
    @Type(() => RelayLabCaseFailureInput)
    failed?: RelayLabCaseFailureInput | null
}

@InputType()
/** `case.hint`: one hint level opened. */
export class RelayLabCaseHintInput extends RelayLabCaseEnvelopeInput {
    /** The lesson. */
    @Field(() => String)
    @IsString()
    @Matches(SLUG)
    lessonId!: string

    /** The case. */
    @Field(() => String)
    @IsString()
    @Matches(SLUG)
    caseId!: string

    /** The level, 1 to 3. */
    @Field(() => Int)
    @IsInt()
    @Min(1)
    @Max(3)
    level!: number

    /** When it opened, ISO 8601 in UTC. */
    @Field(() => String)
    @IsString()
    @Matches(INSTANT)
    at!: string
}

@InputType()
/** `case.reset`: the learner file was reset to a case's reference step. */
export class RelayLabCaseResetInput extends RelayLabCaseEnvelopeInput {
    /** The lesson. */
    @Field(() => String)
    @IsString()
    @Matches(SLUG)
    lessonId!: string

    /** The case. */
    @Field(() => String)
    @IsString()
    @Matches(SLUG)
    caseId!: string

    /** The branch the learner's own work was kept on. */
    @Field(() => String)
    @IsString()
    @MaxLength(200)
    stashedBranch!: string

    /** When it happened, ISO 8601 in UTC. */
    @Field(() => String)
    @IsString()
    @Matches(INSTANT)
    at!: string
}
