import { Field, InputType, Int } from "@nestjs/graphql"
import { IsInt, IsUUID, Max, MaxLength, Min } from "class-validator"

@InputType()
/** The question a hint is asked for. */
export class InterviewHintInput {
    /** The session. */
    @Field(() => String)
    @IsUUID()
    @MaxLength(36)
    sessionId!: string

    /** The position of the open question. */
    @Field(() => Int)
    @IsInt()
    @Min(0)
    @Max(40)
    position!: number
}
