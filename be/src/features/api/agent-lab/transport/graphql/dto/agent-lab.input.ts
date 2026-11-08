import { Field, InputType } from "@nestjs/graphql"
import { IsIn } from "class-validator"
import type { AgentLabLocale } from "@modules/domain/agent-lab"

@InputType()
/** The lab area query: the locale of the copy. */
export class AgentLabInput {
    /** The locale of the copy. */
    @Field(() => String)
    @IsIn(["vi", "en"])
    locale!: AgentLabLocale
}
