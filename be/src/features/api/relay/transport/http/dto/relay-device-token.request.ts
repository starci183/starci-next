import { IsString, Matches, MaxLength } from "class-validator"

/** The bounded body of the device-token door: the secret device code of the start. */
export class RelayDeviceTokenRequest {
    /** The secret device code: 43 base64url characters. */
    @IsString()
    @MaxLength(43)
    @Matches(/^[A-Za-z0-9_-]{43}$/)
    deviceCode!: string
}
