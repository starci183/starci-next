import { Field, InputType } from "@nestjs/graphql"
import { IsUUID, MaxLength } from "class-validator"

@InputType()
/** A session of the learner. */
export class InterviewSessionRefInput {
    /** The session. */
    @Field(() => String)
    @IsUUID()
    @MaxLength(36)
    sessionId!: string
}
