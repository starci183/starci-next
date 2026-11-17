import { Field, InputType } from "@nestjs/graphql"
import { IsIn, IsString, Matches, MaxLength } from "class-validator"
import type { ReviewLocale } from "@modules/domain/review"

@InputType()
/** The deck to read with its samples and progress. */
export class RecallDeckDetailInput {
    /** The deck id, course folder and deck folder. */
    @Field(() => String)
    @IsString()
    @MaxLength(200)
    @Matches(/^[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+$/u)
    deckId!: string

    /** The locale of the text; Vietnamese when left out. */
    @Field(() => String, { defaultValue: "vi" })
    @IsIn(["vi", "en"])
    locale: ReviewLocale = "vi"
}
