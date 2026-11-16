import { Field, InputType } from "@nestjs/graphql"
import { IsIn, IsString, Matches, MaxLength } from "class-validator"
import type { HarnessLocale, HarnessTool } from "@modules/domain/harness"

@InputType()
/** The guide query: the locale, the tool and the slug. */
export class HarnessGuideInput {
    /** The locale of the texts. */
    @Field(() => String, { defaultValue: "vi" })
    @IsIn(["vi", "en"])
    locale: HarnessLocale = "vi"

    /** The tool: claude or codex. */
    @Field(() => String)
    @IsIn(["claude", "codex"])
    tool!: HarnessTool

    /** The guide slug. */
    @Field(() => String)
    @IsString()
    @MaxLength(64)
    @Matches(/^[a-z0-9][a-z0-9-]{0,63}$/u)
    slug!: string
}
