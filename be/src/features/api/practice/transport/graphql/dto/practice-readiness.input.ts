import { Field, InputType } from "@nestjs/graphql"
import { IsIn } from "class-validator"
import type { PracticeLocale } from "@modules/domain/practice"

@InputType()
/** The readiness read: the locale of the pattern titles. */
export class PracticeReadinessInput {
    /** The locale of the titles and the text; Vietnamese when left out. */
    @Field(() => String, { defaultValue: "vi" })
    @IsIn(["vi", "en"])
    locale: PracticeLocale = "vi"
}
