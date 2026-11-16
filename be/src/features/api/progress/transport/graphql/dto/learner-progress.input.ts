import { Field, InputType } from "@nestjs/graphql"
import { IsIn } from "class-validator"
import type { ProgressLocale } from "@modules/domain/progress"

@InputType()
/** The progress query: the locale of the lesson titles and the harness titles. */
export class LearnerProgressInput {
    /** The locale of the titles. */
    @Field(() => String, { defaultValue: "vi" })
    @IsIn(["vi", "en"])
    locale: ProgressLocale = "vi"
}
