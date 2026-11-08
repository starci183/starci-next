import { Field, InputType, Int } from "@nestjs/graphql"
import { IsIn, IsInt, IsString, Matches, Max, MaxLength, Min } from "class-validator"
import type { PracticeLocale } from "@modules/domain/practice"

@InputType()
/** One step of the hint ladder to open. */
export class RevealPracticeHintInput {
    /** The problem slug. */
    @Field(() => String)
    @IsString()
    @MaxLength(100)
    @Matches(/^[a-z0-9][a-z0-9-]*$/u)
    slug!: string

    /** The step, 1 to 3; each step opens only after the one before it. */
    @Field(() => Int)
    @IsInt()
    @Min(1)
    @Max(3)
    step!: number

    /** The locale of the titles and the text; Vietnamese when left out. */
    @Field(() => String, { defaultValue: "vi" })
    @IsIn(["vi", "en"])
    locale: PracticeLocale = "vi"
}
