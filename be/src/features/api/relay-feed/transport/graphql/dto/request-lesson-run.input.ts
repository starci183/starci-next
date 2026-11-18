import { Field, InputType } from "@nestjs/graphql"
import { ArrayMaxSize, IsArray, IsString, Matches, MaxLength } from "class-validator"

@InputType()
/** One scenario run asked of the learner's online device. */
export class RequestLessonRunInput {
    /** The lesson id, a lowercase slug. */
    @Field(() => String)
    @IsString()
    @MaxLength(100)
    @Matches(/^[a-z0-9][a-z0-9-]*$/u)
    lessonId!: string

    /** The scenario id, a lowercase slug. */
    @Field(() => String)
    @IsString()
    @MaxLength(100)
    @Matches(/^[a-z0-9][a-z0-9-]*$/u)
    scenarioId!: string

    /** The guards to switch off for the run; each must be one the scenario names. */
    @Field(() => [String], { defaultValue: [] })
    @IsArray()
    @ArrayMaxSize(10)
    @IsString({ each: true })
    @MaxLength(100, { each: true })
    @Matches(/^[a-z0-9][a-z0-9-]*$/u, { each: true })
    guardsOff!: Array<string>
}
