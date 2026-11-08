import { Field, InputType } from "@nestjs/graphql"
import { IsIn } from "class-validator"
import type { PracticeLocale } from "@modules/domain/practice"

@InputType()
/** The pattern list: the locale of the titles. */
export class PracticePatternsInput {
    /** The locale of the titles and the text; Vietnamese when left out. */
    @Field(() => String, { defaultValue: "vi" })
    @IsIn(["vi", "en"])
    locale: PracticeLocale = "vi"
}
