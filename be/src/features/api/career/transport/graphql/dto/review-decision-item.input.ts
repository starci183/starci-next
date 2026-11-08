import { Field, InputType } from "@nestjs/graphql"
import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from "class-validator"
import type { ReviewVerdict } from "@modules/domain/career"

/** The verdicts a signer gives. */
const REVIEW_VERDICTS: ReadonlyArray<ReviewVerdict> = ["approve", "return"]

@InputType()
/** One decision of a batch. */
export class ReviewDecisionItemInput {
    /** The item. */
    @Field(() => String)
    @MaxLength(40)
    @IsUUID()
    itemId!: string

    /** approve or return. */
    @Field(() => String)
    @IsIn(REVIEW_VERDICTS)
    verdict!: ReviewVerdict

    /** The note for the learner; required for a return. */
    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    @MaxLength(2000)
    note: string | null = null
}
