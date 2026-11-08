import { Field, InputType } from "@nestjs/graphql"
import { IsIn, IsString, Matches, MaxLength } from "class-validator"
import type { PracticeLocale } from "@modules/domain/practice"

@InputType()
/** One problem to open. */
export class PracticeProblemInput {
    /** The problem slug. */
    @Field(() => String)
    @IsString()
    @MaxLength(100)
    @Matches(/^[a-z0-9][a-z0-9-]*$/u)
    slug!: string

    /** The locale of the titles and the text; Vietnamese when left out. */
    @Field(() => String, { defaultValue: "vi" })
    @IsIn(["vi", "en"])
    locale: PracticeLocale = "vi"
}
