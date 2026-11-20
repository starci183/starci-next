import { Field, InputType } from "@nestjs/graphql"
import { IsIn, IsString, Matches, MaxLength } from "class-validator"
import type { LessonLocale } from "@modules/domain/lesson"

@InputType()
/** The option a guest picked for one free choice; nothing of it is stored. */
export class GradeGuestOpenerInput {
    /** The lesson id, a lowercase slug. */
    @Field(() => String)
    @IsString()
    @MaxLength(100)
    @Matches(/^[a-z0-9][a-z0-9-]*$/u)
    lessonId!: string

    /** The version the guest studies, as the lesson query served it. */
    @Field(() => String)
    @IsString()
    @MaxLength(100)
    version!: string

    /** The activity id, an opener question. */
    @Field(() => String)
    @IsString()
    @MaxLength(200)
    activityId!: string

    /** The option picked. */
    @Field(() => String)
    @IsString()
    @MaxLength(200)
    optionId!: string

    /** The locale of the feedback; Vietnamese when left out. */
    @Field(() => String, { defaultValue: "vi" })
    @IsIn(["vi", "en"])
    locale: LessonLocale = "vi"
}
