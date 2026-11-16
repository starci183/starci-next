import { Field, InputType } from "@nestjs/graphql"
import { IsIn, IsString, Matches, MaxLength } from "class-validator"
import type { HarnessLocale } from "@modules/domain/harness"

@InputType()
/** The doc query: the locale and the slug. */
export class HarnessDocInput {
    /** The locale of the texts. */
    @Field(() => String, { defaultValue: "vi" })
    @IsIn(["vi", "en"])
    locale: HarnessLocale = "vi"

    /** The doc slug. */
    @Field(() => String)
    @IsString()
    @MaxLength(64)
    @Matches(/^[a-z0-9][a-z0-9-]{0,63}$/u)
    slug!: string
}
