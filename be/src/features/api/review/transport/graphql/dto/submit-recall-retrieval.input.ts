import { Field, InputType, Int } from "@nestjs/graphql"
import { IsIn, IsInt, IsString, Matches, Max, MaxLength, Min } from "class-validator"
import type { ReviewLocale } from "@modules/domain/review"

@InputType()
/** The written answer to a retrieval item. */
export class SubmitRecallRetrievalInput {
    /** The item id. */
    @Field(() => String)
    @IsString()
    @MaxLength(300)
    @Matches(/^(card:[A-Za-z0-9._/-]+|retrieval:[a-z0-9][a-z0-9-]*\/[A-Za-z0-9._-]+)$/u)
    itemId!: string

    /** The revision the grade will carry; the one after the newest. */
    @Field(() => Int)
    @IsInt()
    @Min(1)
    @Max(100000)
    revision!: number

    /** The answer in the own words of the learner. */
    @Field(() => String)
    @IsString()
    @MaxLength(4000)
    text!: string

    /** The locale of the text; Vietnamese when left out. */
    @Field(() => String, { defaultValue: "vi" })
    @IsIn(["vi", "en"])
    locale: ReviewLocale = "vi"
}
