import { Field, InputType, Int } from "@nestjs/graphql"
import { IsIn, IsInt, IsString, Max, MaxLength, Min } from "class-validator"
import type { ProfileLocale } from "@modules/domain/profile"

@InputType()
/** The uploaded avatar a learner keeps: the key the request answered with the type and size that were asked for. */
export class ConfirmAvatarUploadInput {
    /** The storage key the upload request answered. */
    @Field(() => String)
    @IsString()
    @MaxLength(200)
    key!: string

    /** The content type that was asked for. */
    @Field(() => String)
    @IsString()
    @MaxLength(100)
    contentType!: string

    /** The size that was asked for. */
    @Field(() => Int)
    @IsInt()
    @Min(1)
    @Max(2147483647)
    size!: number

    /** The locale of the answer. */
    @Field(() => String, { defaultValue: "vi" })
    @IsIn(["vi", "en"])
    locale: ProfileLocale = "vi"
}
