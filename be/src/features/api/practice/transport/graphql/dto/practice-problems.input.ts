import { Field, InputType } from "@nestjs/graphql"
import { IsIn, IsString, Matches, MaxLength } from "class-validator"
import type { PracticeLocale } from "@modules/domain/practice"

@InputType()
/** The problems of one pattern. */
export class PracticeProblemsInput {
    /** The pattern id. */
    @Field(() => String)
    @IsString()
    @MaxLength(40)
    @Matches(/^[A-Za-z][A-Za-z0-9]*$/u)
    patternId!: string

    /** The locale of the titles and the text; Vietnamese when left out. */
    @Field(() => String, { defaultValue: "vi" })
    @IsIn(["vi", "en"])
    locale: PracticeLocale = "vi"
}
