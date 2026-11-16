import { Field, InputType } from "@nestjs/graphql"
import { IsIn } from "class-validator"
import type { HarnessLocale } from "@modules/domain/harness"

@InputType()
/** A harness read that takes only the locale of its texts. */
export class HarnessLocaleInput {
    /** The locale of the texts. */
    @Field(() => String, { defaultValue: "vi" })
    @IsIn(["vi", "en"])
    locale: HarnessLocale = "vi"
}
