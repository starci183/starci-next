import { Field, InputType } from "@nestjs/graphql"
import { IsIn, IsString, Matches, MaxLength } from "class-validator"
import type { AgentLabLocale } from "@modules/domain/agent-lab"

@InputType()
/** The track query: which track and the locale of its copy. */
export class AgentLabTrackInput {
    /** The track id, a lowercase slug. */
    @Field(() => String)
    @IsString()
    @MaxLength(40)
    @Matches(/^[a-z0-9][a-z0-9-]*$/u)
    trackId!: string

    /** The locale of the copy. */
    @Field(() => String)
    @IsIn(["vi", "en"])
    locale!: AgentLabLocale
}
