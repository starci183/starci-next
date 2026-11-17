import { Field, InputType } from "@nestjs/graphql"
import { IsIn, IsOptional, IsString, Matches, MaxLength } from "class-validator"
import type { PracticeLocale } from "@modules/domain/practice"

@InputType()
/** The next and the resume problem, for the whole catalog or one pattern. */
export class PracticeNextInput {
    /** The pattern to restrict both to; the whole catalog when left out. */
    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    @MaxLength(40)
    @Matches(/^[A-Za-z][A-Za-z0-9]*$/u)
    patternId: string | null = null

    /** The locale of the titles; Vietnamese when left out. */
    @Field(() => String, { defaultValue: "vi" })
    @IsIn(["vi", "en"])
    locale: PracticeLocale = "vi"
}
