import { IsString, Matches, MaxLength, MinLength } from "class-validator"

/** The bounded body of the password-reset-verify door. */
export class PasswordResetVerifyRequest {
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

    /** The chosen password; the domain enforces 6 to 256 characters with IDENTITY_PASSWORD_INVALID. */
    @IsString()
    @MaxLength(1024)
    password!: string
}
