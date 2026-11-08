import { Field, InputType } from "@nestjs/graphql"
import { Type } from "class-transformer"
import { ArrayMaxSize, IsArray, IsOptional, IsString, MaxLength, ValidateNested } from "class-validator"
import { LessonAttemptFileInput } from "./lesson-attempt-file.input"

@InputType()
/** The answer of a learner; only the fields of the activity kind are read: the option of a choice, the path of a simulation, the text and files of a written answer. */
export class LessonAttemptAnswerInput {
    /** The option picked in a choice. */
    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    @MaxLength(200)
    optionId: string | null = null

    /** The written explanation of an explain or exercise activity. */
    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    @MaxLength(20000)
    text: string | null = null

    /** The actions taken in a simulation, in order, from its initial state. */
    @Field(() => [String], { nullable: true })
    @IsOptional()
    @IsArray()
    @ArrayMaxSize(200)
    @IsString({ each: true })
    @MaxLength(200, { each: true })
    actionIds: Array<string> | null = null

    /** The state the simulation path reached. */
    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    @MaxLength(200)
    reachedStateId: string | null = null

    /** The answer to the debrief question of a simulation. */
    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    @MaxLength(5000)
    debrief: string | null = null

    /** The files of an exercise. */
    @Field(() => [LessonAttemptFileInput], { nullable: true })
    @IsOptional()
    @IsArray()
    @ArrayMaxSize(20)
    @ValidateNested({ each: true })
    @Type(() => LessonAttemptFileInput)
    files: Array<LessonAttemptFileInput> | null = null
}
