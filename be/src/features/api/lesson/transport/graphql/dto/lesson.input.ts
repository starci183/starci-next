import { Field, InputType } from "@nestjs/graphql"
import { IsIn, IsString, Matches, MaxLength } from "class-validator"
import type { LessonLocale } from "@modules/domain/lesson"

@InputType()
/** The lesson query: which lesson and the locale of its text. */
export class LessonInput {
    /** The lesson id, a lowercase slug. */
    @Field(() => String)
    @IsString()
    @MaxLength(100)
    @Matches(/^[a-z0-9][a-z0-9-]*$/u)
    id!: string

    /** The locale of the text. */
    @Field(() => String)
    @IsIn(["vi", "en"])
    locale!: LessonLocale
}
