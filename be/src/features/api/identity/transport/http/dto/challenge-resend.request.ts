import { IsString, MaxLength, MinLength } from "class-validator"

/** The bounded body of the challenge-resend door. */
export class ChallengeResendRequest {
    /** The opaque challenge the previous door returned. */
    @IsString()
    @MinLength(1)
    @MaxLength(512)
    challenge!: string
}
