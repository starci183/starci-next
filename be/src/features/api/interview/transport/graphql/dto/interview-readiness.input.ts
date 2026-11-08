import { Field, InputType } from "@nestjs/graphql"
import { IsIn, IsString, MaxLength } from "class-validator"
import type { InterviewTier } from "@modules/domain/interview"

@InputType()
/** The track and tier whose readiness is read. */
export class InterviewReadinessInput {
    /** The track. */
    @Field(() => String)
    @IsString()
    @MaxLength(60)
    track!: string

    /** The tier. */
    @Field(() => String)
    @IsIn(["junior", "middle", "senior"])
    tier!: InterviewTier
}
