import { Field, InputType } from "@nestjs/graphql"
import { IsIn } from "class-validator"
import type { PathLocale } from "@modules/domain/path"

@InputType()
/** The outcome paths query: the locale of its texts. */
export class OutcomePathsInput {
    /** The locale of the texts. */
    @Field(() => String, { defaultValue: "vi" })
    @IsIn(["vi", "en"])
    locale: PathLocale = "vi"
}
