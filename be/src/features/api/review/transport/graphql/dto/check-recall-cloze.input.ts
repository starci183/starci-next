import { Field, InputType, Int } from "@nestjs/graphql"
import { IsIn, IsInt, IsString, Matches, Max, MaxLength, Min } from "class-validator"
import type { ReviewLocale } from "@modules/domain/review"

@InputType()
/** A choice picked for one cloze of an item. */
export class CheckRecallClozeInput {
    /** The item id. */
    @Field(() => String)
    @IsString()
    @MaxLength(300)
    @Matches(/^(card:[A-Za-z0-9._/-]+|retrieval:[a-z0-9][a-z0-9-]*\/[A-Za-z0-9._-]+)$/u)
    itemId!: string

    /** The cloze number. */
    @Field(() => Int)
    @IsInt()
    @Min(1)
    @Max(50)
    n!: number

    /** The picked choice. */
    @Field(() => String)
    @IsString()
    @MaxLength(300)
    choice!: string

    /** The locale of the text; Vietnamese when left out. */
    @Field(() => String, { defaultValue: "vi" })
    @IsIn(["vi", "en"])
    locale: ReviewLocale = "vi"
}
