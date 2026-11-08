import { IsString, MaxLength, MinLength } from "class-validator"

/** The bounded body of the device-start door; the domain refuses an unknown platform with RELAY_PAIRING_INVALID. */
export class RelayDeviceStartRequest {
    /** The device name the learner will recognise. */
    @IsString()
    @MinLength(1)
    @MaxLength(60)
    deviceName!: string

    /** The device's operating system: windows, macos or linux. */
    @IsString()
    @MinLength(1)
    @MaxLength(16)
    platform!: string
}
