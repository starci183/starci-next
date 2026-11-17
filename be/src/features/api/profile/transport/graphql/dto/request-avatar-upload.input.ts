import { Field, InputType, Int } from "@nestjs/graphql"
import { IsInt, IsString, Max, MaxLength, Min } from "class-validator"

@InputType()
/** The avatar a learner wants to upload: its content type and exact size; the limits are checked by the profile capability. */
export class RequestAvatarUploadInput {
    /** The content type of the image. */
    @Field(() => String)
    @IsString()
    @MaxLength(100)
    contentType!: string

    /** The exact size of the image in bytes. */
    @Field(() => Int)
    @IsInt()
    @Min(1)
    @Max(2147483647)
    size!: number
}
