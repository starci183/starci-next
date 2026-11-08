import { IsString, MaxLength, MinLength } from "class-validator"

/** The bounded body of the social-exchange door. */
export class SocialExchangeRequest {
    /** The single-use authorization code. */
    @IsString()
    @MinLength(1)
    @MaxLength(2048)
    code!: string

    /** The one-use state returned by the provider. */
    @IsString()
    @MinLength(1)
    @MaxLength(512)
    state!: string
}
