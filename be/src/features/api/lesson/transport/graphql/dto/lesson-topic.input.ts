import { Field, InputType } from "@nestjs/graphql"
import { IsIn, IsString, Matches, MaxLength } from "class-validator"
import type { LessonLocale } from "@modules/domain/lesson"

@InputType()
/** The topic query: which topic and the locale of its titles. */
export class LessonTopicInput {
    /** The topic slug, a lowercase slug. */
    @Field(() => String)
    @IsString()
    @MaxLength(100)
    @Matches(/^[a-z0-9][a-z0-9-]*$/u)
    topic!: string

    /** The locale of the titles. */
    @Field(() => String)
    @IsIn(["vi", "en"])
    locale!: LessonLocale
}
