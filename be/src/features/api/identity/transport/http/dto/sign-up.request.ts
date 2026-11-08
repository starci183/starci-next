import { Equals, IsOptional, IsString, MaxLength, MinLength } from "class-validator"

/** The bounded body of the sign-up door. */
export class SignUpRequest {
    /** The email address. */
    @IsString()
    @MinLength(3)
    @MaxLength(320)
    email!: string

    /** The chosen password; the domain enforces 6 to 256 characters with IDENTITY_PASSWORD_INVALID. */
    @IsString()
    @MaxLength(1024)
    password!: string

    /** An optional username, 3 to 100 characters. */
    @IsOptional()
    @IsString()
    @MinLength(3)
    @MaxLength(100)
    username?: string

    /** The learner accepted the terms. */
    @Equals(true)
    acceptTerms!: true
}
