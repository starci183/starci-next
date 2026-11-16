import { Field, InputType } from "@nestjs/graphql"
import { IsIn } from "class-validator"
import type { HarnessLocale, HarnessTool } from "@modules/domain/harness"

@InputType()
/** The doctor query: the locale and the tool. */
export class HarnessDoctorInput {
    /** The locale of the texts. */
    @Field(() => String, { defaultValue: "vi" })
    @IsIn(["vi", "en"])
    locale: HarnessLocale = "vi"

    /** The tool: claude or codex. */
    @Field(() => String)
    @IsIn(["claude", "codex"])
    tool!: HarnessTool
}
