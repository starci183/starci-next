import { Field, InputType } from "@nestjs/graphql"
import { IsBoolean, IsIn, IsOptional, IsString, Matches, MaxLength } from "class-validator"

@InputType()
/** The relayManifest arguments: the task the device asks the checks of. */
export class RelayManifestInput {
    /** The task (a project id). */
    @Field(() => String)
    @IsString()
    @MaxLength(100)
    @Matches(/^[A-Za-z0-9._:/-]+$/u)
    taskId!: string

    /** The milestone of a project run; with it the manifest carries the milestone's concepts and the learner's test command. */
    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    @Matches(/^[a-z0-9-]+$/u)
    milestone?: string

    /** The `test.command` of the project's `starci/project.yaml`. */
    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    @MaxLength(400)
    testCommand?: string

    /** The `test.report` of the project's `starci/project.yaml`. */
    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    @MaxLength(200)
    testReport?: string

    /** For a lesson task (`lesson:<slug>`): the one scenario to run or check. */
    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    @Matches(/^[a-z0-9-]+$/u)
    scenario?: string

    /** For a lesson task: the challenge tier (easy, medium, hard, insane) whose hidden scenarios are asked. */
    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsIn(["easy", "medium", "hard", "insane"])
    challenge?: string

    /** For a lesson task: true to sign the Tìm sạn bug pack (its tarball and its tests). */
    @Field(() => Boolean, { nullable: true })
    @IsOptional()
    @IsBoolean()
    bugs?: boolean

    /** For a harness trial task: the tool whose headless run the manifest is for. */
    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsIn(["claude", "codex"])
    tool?: string
}
