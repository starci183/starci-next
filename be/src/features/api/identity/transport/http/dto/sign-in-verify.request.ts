import { IsString, Matches, MaxLength, MinLength } from "class-validator"

/** The bounded body of the sign-in-verify door. */
export class SignInVerifyRequest {
    /** The opaque challenge the previous door returned. */
    @IsString()
    @MinLength(1)
    @MaxLength(512)
    challenge!: string

    /** The six-digit emailed code. */
    @IsString()
    @MaxLength(6)
    @Matches(/^\d{6}$/)
    code!: string
}
