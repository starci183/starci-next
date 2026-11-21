import { Field, InputType } from "@nestjs/graphql"
import { IsIn, IsString, Matches, MaxLength } from "class-validator"
import type { LessonLocale } from "@modules/domain/lesson"

@InputType()
/** The lesson whose Tìm sạn results are read. */
export class LessonBugResultsInput {
    /** The lesson id, a lowercase slug. */
    @Field(() => String)
    @IsString()
    @MaxLength(100)
    @Matches(/^[a-z0-9][a-z0-9-]*$/u)
    lessonId!: string

    /** The locale of the texts; Vietnamese when left out. */
    @Field(() => String, { defaultValue: "vi" })
    @IsIn(["vi", "en"])
    locale: LessonLocale = "vi"
}

@InputType()
/** The Tìm sạn test whose next hint the learner opens. */
export class OpenLessonBugHintInput extends LessonBugResultsInput {
    /** The test id, a lowercase slug. */
    @Field(() => String)
    @IsString()
    @MaxLength(64)
    @Matches(/^[a-z0-9][a-z0-9-]*$/u)
    testId!: string
}
