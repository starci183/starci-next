import { Field, InputType } from "@nestjs/graphql"
import { IsString, Matches, MaxLength } from "class-validator"

@InputType()
/** A six-digit pairing code the learner issued on the web, with the device that claims it. */
export class ClaimRelayPairCodeInput {
    /** The six-digit code (spaces and a dash are ignored). */
    @Field(() => String)
    @IsString()
    @MaxLength(16)
    @Matches(/^[\d\s-]+$/u)
    code!: string

    /** The device name shown in the devices list, 1 to 60 characters. */
    @Field(() => String)
    @IsString()
    @MaxLength(60)
    deviceName!: string

    /** The device platform: windows, macos or linux. */
    @Field(() => String)
    @IsString()
    @MaxLength(16)
    platform!: string
}

@InputType()
/** The public key a device signs its grading results with. */
export class RegisterRelayDeviceKeyInput {
    /** The base64 SPKI (DER) Ed25519 public key. */
    @Field(() => String)
    @IsString()
    @MaxLength(120)
    @Matches(/^[A-Za-z0-9+/]+={0,2}$/u)
    publicKey!: string
}
