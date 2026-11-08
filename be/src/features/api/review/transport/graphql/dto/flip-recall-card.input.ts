import { Field, InputType } from "@nestjs/graphql"
import { IsIn, IsString, Matches, MaxLength } from "class-validator"
import type { ReviewLocale } from "@modules/domain/review"

@InputType()
/** The card to flip. */
export class FlipRecallCardInput {
    /** The item id. */
    @Field(() => String)
    @IsString()
    @MaxLength(300)
    @Matches(/^(card:[A-Za-z0-9._/-]+|retrieval:[a-z0-9][a-z0-9-]*\/[A-Za-z0-9._-]+)$/u)
    itemId!: string

    /** The locale of the text; Vietnamese when left out. */
    @Field(() => String, { defaultValue: "vi" })
    @IsIn(["vi", "en"])
    locale: ReviewLocale = "vi"
}
