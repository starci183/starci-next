import { Field, InputType, Int } from "@nestjs/graphql"
import { IsIn, IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min } from "class-validator"
import type { PracticeLocale } from "@modules/domain/practice"

@InputType()
/** One page of the caller's graded submits in one pattern. */
export class PracticeSubmissionsInput {
    /** The pattern id. */
    @Field(() => String)
    @IsString()
    @MaxLength(40)
    @Matches(/^[A-Za-z][A-Za-z0-9]*$/u)
    patternId!: string

    /** The locale of the problem titles; Vietnamese when left out. */
    @Field(() => String, { defaultValue: "vi" })
    @IsIn(["vi", "en"])
    locale: PracticeLocale = "vi"

    /** The most submissions wanted: the page setting (20) when absent, at most 50. */
    @Field(() => Int, { nullable: true, defaultValue: 20 })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(50)
    limit: number | null = 20

    /** The cursor the page before answered; absent, the first page. */
    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    @MaxLength(2048)
    cursor: string | null = null
}
