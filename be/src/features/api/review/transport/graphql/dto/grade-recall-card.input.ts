import { Field, InputType, Int } from "@nestjs/graphql"
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min } from "class-validator"

@InputType()
/** The self-grade of a revealed item. */
export class GradeRecallCardInput {
    /** The item id. */
    @Field(() => String)
    @IsString()
    @MaxLength(300)
    @Matches(/^(card:[A-Za-z0-9._/-]+|retrieval:[a-z0-9][a-z0-9-]*\/[A-Za-z0-9._-]+)$/u)
    itemId!: string

    /** The revision of this review; a resend with the same grade changes nothing. */
    @Field(() => Int)
    @IsInt()
    @Min(1)
    @Max(100000)
    revision!: number

    /** AGAIN, HARD, GOOD or EASY. */
    @Field(() => String)
    @MaxLength(5)
    @IsIn(["AGAIN", "HARD", "GOOD", "EASY"])
    grade!: string

    /** Whether the learner picked the hidden term in the cloze check. */
    @Field(() => Boolean, { nullable: true })
    @IsOptional()
    @IsBoolean()
    clozeCorrect?: boolean | null
}
