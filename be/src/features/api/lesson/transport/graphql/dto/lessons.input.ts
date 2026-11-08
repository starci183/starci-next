import { Field, InputType } from "@nestjs/graphql"
import { IsIn, IsOptional, IsString, MaxLength } from "class-validator"
import type { LessonDifficulty, LessonLocale } from "@modules/domain/lesson"

@InputType()
/** The catalog query: the locale of the titles and the optional filters. */
export class LessonsInput {
    /** The locale of the titles and descriptions. */
    @Field(() => String)
    @IsIn(["vi", "en"])
    locale!: LessonLocale

    /** Only this group. */
    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    @MaxLength(40)
    group: string | null = null

    /** Only this topic. */
    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    topic: string | null = null

    /** Only this category. */
    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    @MaxLength(40)
    category: string | null = null

    /** Only this difficulty. */
    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsIn(["foundation", "intermediate", "advanced"])
    difficulty: LessonDifficulty | null = null

    /** Only lessons in this implementation language. */
    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    @MaxLength(40)
    language: string | null = null

    /** Only lessons for this cloud provider. */
    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    @MaxLength(40)
    provider: string | null = null

    /** Only lessons whose title or description contains this text. */
    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    q: string | null = null
}
