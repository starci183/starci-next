import { Field, InputType, Int } from "@nestjs/graphql"
import { Type } from "class-transformer"
import { IsIn, IsInt, IsString, Matches, Max, MaxLength, Min, ValidateNested } from "class-validator"
import type { LessonLocale } from "@modules/domain/lesson"
import { LessonAttemptAnswerInput } from "./lesson-attempt-answer.input"

@InputType()
/** The answer of a learner to one activity of a lesson version, under a revision. */
export class SubmitLessonAttemptInput {
    /** The lesson id, a lowercase slug. */
    @Field(() => String)
    @IsString()
    @MaxLength(100)
    @Matches(/^[a-z0-9][a-z0-9-]*$/u)
    lessonId!: string

    /** The version the learner studies, as the lesson query served it. */
    @Field(() => String)
    @IsString()
    @MaxLength(100)
    version!: string

    /** The activity id. */
    @Field(() => String)
    @IsString()
    @MaxLength(200)
    activityId!: string

    /** The revision of the answer to the activity; a resend with the same revision never makes a second attempt. */
    @Field(() => Int)
    @IsInt()
    @Min(1)
    @Max(1000)
    revision!: number

    /** The locale of the text and of the feedback; Vietnamese when left out. */
    @Field(() => String, { defaultValue: "vi" })
    @IsIn(["vi", "en"])
    locale: LessonLocale = "vi"

    /** The answer. */
    @Field(() => LessonAttemptAnswerInput)
    @ValidateNested()
    @Type(() => LessonAttemptAnswerInput)
    answer!: LessonAttemptAnswerInput
}
