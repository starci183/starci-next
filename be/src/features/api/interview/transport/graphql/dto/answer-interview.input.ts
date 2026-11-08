import { Field, InputType, Int } from "@nestjs/graphql"
import { IsBoolean, IsInt, IsString, IsUUID, Max, MaxLength, Min } from "class-validator"

@InputType()
/** The answer to the open question. */
export class AnswerInterviewInput {
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

    /** 0 for the first answer to the question, then one more for each follow-up answered. */
    @Field(() => Int)
    @IsInt()
    @Min(0)
    @Max(10)
    revision!: number

    /** The answer. */
    @Field(() => String, { defaultValue: "" })
    @IsString()
    @MaxLength(10000)
    text: string = ""

    /** True to skip the question. */
    @Field(() => Boolean, { defaultValue: false })
    @IsBoolean()
    isSkipped: boolean = false
}
