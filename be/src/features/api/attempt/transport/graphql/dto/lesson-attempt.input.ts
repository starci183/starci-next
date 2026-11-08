import { Field, InputType } from "@nestjs/graphql"
import { IsUUID, MaxLength } from "class-validator"

@InputType()
/** The attempt to read. */
export class LessonAttemptInput {
    /** The attempt id. */
    @Field(() => String)
    @IsUUID()
    @MaxLength(36)
    attemptId!: string
}
