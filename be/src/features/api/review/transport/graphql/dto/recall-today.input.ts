import { Field, InputType } from "@nestjs/graphql"
import { IsIn } from "class-validator"
import type { ReviewLocale } from "@modules/domain/review"

@InputType()
/** The locale of the review day. */
export class RecallTodayInput {
    /** The locale of the text; Vietnamese when left out. */
    @Field(() => String, { defaultValue: "vi" })
    @IsIn(["vi", "en"])
    locale: ReviewLocale = "vi"
}
