import { Field, InputType, Int } from "@nestjs/graphql"
import { ArrayMaxSize, IsArray, IsInt, IsString, Matches, Max, MaxLength, Min } from "class-validator"

const SLUG = /^[a-z0-9][a-z0-9-]*$/u

@InputType()
/** The lab of one lesson of a course. */
export class CourseLabInput {
    /** The course id, a lowercase slug. */
    @Field(() => String)
    @IsString()
    @MaxLength(64)
    @Matches(SLUG)
    courseId!: string

    /** The lesson id, a lowercase slug. */
    @Field(() => String)
    @IsString()
    @MaxLength(64)
    @Matches(SLUG)
    lessonId!: string
}

@InputType()
/** The chaos switches to turn on for a lab; every switch not listed is turned off. */
export class SetCourseLabChaosInput extends CourseLabInput {
    /** The switch ids that are on afterwards. */
    @Field(() => [String], { defaultValue: [] })
    @IsArray()
    @ArrayMaxSize(20)
    @IsString({ each: true })
    @MaxLength(100, { each: true })
    @Matches(/^[A-Za-z0-9._:-]+$/u, { each: true })
    chaosIds!: Array<string>
}

@InputType()
/** What the learner supplies when submitting a lab for grading on their own machine. */
export class SubmitCourseLabInput extends CourseLabInput {
    /** How many hints the learner opened. */
    @Field(() => Int)
    @IsInt()
    @Min(0)
    @Max(1000)
    hintsOpened!: number

    /** How long the learner spent, in milliseconds. */
    @Field(() => Int)
    @IsInt()
    @Min(0)
    @Max(2_000_000_000)
    timeSpentMs!: number

    /** The design document: one string per paragraph, 50 paragraphs of 4000 characters at most. */
    @Field(() => [String], { defaultValue: [] })
    @IsArray()
    @ArrayMaxSize(50)
    @IsString({ each: true })
    @MaxLength(4000, { each: true })
    designDoc!: Array<string>
}
