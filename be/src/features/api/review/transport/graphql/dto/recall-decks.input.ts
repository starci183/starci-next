import { Field, InputType } from "@nestjs/graphql"
import { IsIn, IsOptional, IsString, MaxLength } from "class-validator"
import type { ReviewLocale } from "@modules/domain/review"

@InputType()
/** The decks to list. */
export class RecallDecksInput {
    /** The locale of the text; Vietnamese when left out. */
    @Field(() => String, { defaultValue: "vi" })
    @IsIn(["vi", "en"])
    locale: ReviewLocale = "vi"

    /** Only the decks of this outcome track. */
    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    track?: string | null
}
