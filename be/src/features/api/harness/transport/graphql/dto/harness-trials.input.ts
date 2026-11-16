import { Field, InputType } from "@nestjs/graphql"
import { IsIn, IsOptional } from "class-validator"
import type { HarnessLocale, HarnessTool } from "@modules/domain/harness"

@InputType()
/** The trials query: the locale and, optionally, one tool. */
export class HarnessTrialsInput {
    /** The locale of the texts. */
    @Field(() => String, { defaultValue: "vi" })
    @IsIn(["vi", "en"])
    locale: HarnessLocale = "vi"

    /** The tool to list traps for, or none for every trap. */
    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsIn(["claude", "codex"])
    tool?: HarnessTool
}
