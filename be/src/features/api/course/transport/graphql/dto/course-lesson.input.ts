import { Field, InputType, Int } from "@nestjs/graphql"
import { IsIn, IsInt, IsString, Matches, Max, MaxLength, Min } from "class-validator"
import { COURSE_HINT_LEVELS, type CourseLocale } from "@modules/domain/course"

const SLUG = /^[a-z0-9][a-z0-9-]*$/u

@InputType()
/** The lesson whose cases the learner reads. */
export class CourseCasesInput {
    /** The lesson id, a lowercase slug. */
    @Field(() => String)
    @IsString()
    @MaxLength(100)
    @Matches(SLUG)
    lessonId!: string
}

@InputType()
/** The lesson whose lab the learner reads, and the language of its hint texts. */
export class CourseLessonInput extends CourseCasesInput {
    /** The locale of the hint texts; Vietnamese when left out. */
    @Field(() => String, { defaultValue: "vi" })
    @IsIn(["vi", "en"])
    locale: CourseLocale = "vi"
}

@InputType()
/** The hint level the learner opens on one case. */
export class OpenCourseHintInput extends CourseLessonInput {
    /** The case id, a lowercase slug. */
    @Field(() => String)
    @IsString()
    @MaxLength(100)
    @Matches(SLUG)
    caseId!: string

    /** The level, 1 to 3. */
    @Field(() => Int)
    @IsInt()
    @Min(1)
    @Max(COURSE_HINT_LEVELS)
    level!: number
}
