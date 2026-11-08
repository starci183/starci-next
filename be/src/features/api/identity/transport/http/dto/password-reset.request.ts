import { IsString, MaxLength, MinLength } from "class-validator"

/** The bounded body of the password-reset door. */
export class PasswordResetRequest {
    /** The email address. */
    @IsString()
    @MinLength(3)
    @MaxLength(320)
    email!: string
}
