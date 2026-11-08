import { Field, InputType } from "@nestjs/graphql"
import { IsUUID, MaxLength } from "class-validator"

@InputType()
/** One submission of the caller to read. */
export class PracticeSubmissionInput {
    /** The submission id. */
    @Field(() => String)
    @IsUUID()
    @MaxLength(36)
    submissionId!: string
}
