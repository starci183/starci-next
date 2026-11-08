import { Field, InputType } from "@nestjs/graphql"
import { IsIn, IsOptional, IsString, MaxLength } from "class-validator"
import type { LessonLocale } from "@modules/domain/lesson"

@InputType()
/** The incident list query: the locale of the titles and an optional topic. */
export class IncidentsInput {
    /** The locale of the titles. */
    @Field(() => String)
    @IsIn(["vi", "en"])
    locale!: LessonLocale

    /** Only this topic. */
    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    topic: string | null = null
}
