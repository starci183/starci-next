import { Field, InputType } from "@nestjs/graphql"
import { IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator"

@InputType()
/** The startPremiumCheckout arguments: the plan and rail names; the price is the server's. */
export class StartPremiumCheckoutInput {
    /** The server-owned plan the learner selects, such as monthly or yearly. */
    @Field(() => String)
    @IsString()
    @IsNotEmpty()
    @MaxLength(32)
    plan!: string

    /** The rail to pay on, sepay or payos; absent, the learner last-used rail, otherwise sepay. */
    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    @MaxLength(16)
    rail: string | null = null
}
