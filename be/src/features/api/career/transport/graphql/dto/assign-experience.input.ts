import { Field, InputType } from "@nestjs/graphql"
import { IsOptional, IsUUID, MaxLength } from "class-validator"

@InputType()
/** A reassignment by the teacher. */
export class AssignExperienceInput {
    /** The item. */
    @Field(() => String)
    @MaxLength(40)
    @IsUUID()
    itemId!: string

    /** The reviewer, or null for the teacher's queue. */
    @Field(() => String, { nullable: true })
    @IsOptional()
    @MaxLength(40)
    @IsUUID()
    reviewerId: string | null = null
}
