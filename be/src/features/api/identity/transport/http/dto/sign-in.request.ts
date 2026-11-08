import { IsString, MaxLength, MinLength } from "class-validator"

/** The bounded body of the sign-in door. */
export class SignInRequest {
    /** The email or username. */
    @IsString()
    @MinLength(1)
    @MaxLength(320)
    identifier!: string

    /** The password. */
    @IsString()
    @MinLength(1)
    @MaxLength(256)
    password!: string
}
