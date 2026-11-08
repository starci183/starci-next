import type { SocialProvider } from "@modules/integrations/keycloak"
import { IsOptional, IsString, Matches, MaxLength, MinLength } from "class-validator"

/** A single leading slash, no `//` or `/\`, no whitespace, and not the sign-in screen itself. */
const SAME_ORIGIN_PATH = /^\/(?![/\\]|sign-in(?:[/?#]|$))\S*$/

/** The bounded body of the social-start door. */
export class SocialStartRequest {
    /** The social provider alias; the domain refuses any alias it does not offer with IDENTITY_PROVIDER_UNKNOWN. */
    @IsString()
    @MinLength(1)
    @MaxLength(32)
    provider!: SocialProvider

    /** A same-origin relative path to land on after sign-in. */
    @IsOptional()
    @IsString()
    @MaxLength(512)
    @Matches(SAME_ORIGIN_PATH)
    returnTo?: string
}
