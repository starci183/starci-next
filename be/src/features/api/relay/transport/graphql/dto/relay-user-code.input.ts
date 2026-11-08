import { Field, InputType } from "@nestjs/graphql"
import { IsString, MaxLength, MinLength } from "class-validator"

@InputType()
/** A pairing code as the learner typed it; the domain normalizes case and the dash. */
export class RelayUserCodeInput {
    /** The short code the CLI printed, `XXXX-XXXX`. */
    @Field(() => String)
    @IsString()
    @MinLength(8)
    @MaxLength(12)
    userCode!: string
}
