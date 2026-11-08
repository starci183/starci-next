import { Field, InputType } from "@nestjs/graphql"
import { IsOptional, IsString, MaxLength } from "class-validator"

@InputType()
/** The track whose history is read. */
export class InterviewHistoryInput {
    /** Only this track. */
    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    @MaxLength(60)
    track: string | null = null
}
