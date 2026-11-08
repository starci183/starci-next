import { Field, InputType } from "@nestjs/graphql"
import { IsIn, IsOptional, IsString, MaxLength } from "class-validator"
import type { InterviewLocale } from "@modules/domain/interview"

@InputType()
/** The locale and the track whose options are read. */
export class InterviewOptionsInput {
    /** The locale of the titles; Vietnamese when left out. */
    @Field(() => String, { defaultValue: "vi" })
    @IsIn(["vi", "en"])
    locale: InterviewLocale = "vi"

    /** Only the banks of this track. */
    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    @MaxLength(60)
    track: string | null = null
}
