import { Field, InputType } from "@nestjs/graphql"
import { ArrayMaxSize, IsArray, IsIn, IsOptional, IsString, Matches, MaxLength, MinLength } from "class-validator"
import type { InterviewLocale, InterviewTier } from "@modules/domain/interview"

@InputType()
/** The setup of a session and the key that makes the start repeatable. */
export class StartInterviewInput {
    /** The outcome track. */
    @Field(() => String)
    @IsString()
    @MaxLength(60)
    track!: string

    /** Only these banks. */
    @Field(() => [String], { nullable: true })
    @IsOptional()
    @IsArray()
    @ArrayMaxSize(40)
    @IsString({ each: true })
    @MaxLength(120, { each: true })
    bankIds: Array<string> | null = null

    /** The tier. */
    @Field(() => String)
    @IsIn(["junior", "middle", "senior"])
    tier!: InterviewTier

    /** The locale; Vietnamese when left out. */
    @Field(() => String, { defaultValue: "vi" })
    @IsIn(["vi", "en"])
    locale: InterviewLocale = "vi"

    /** The code language. */
    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    @MaxLength(32)
    @Matches(/^[a-z0-9-]+$/u)
    language: string | null = null

    /** A key the client makes once per start; a resend never starts a second session. */
    @Field(() => String)
    @IsString()
    @MinLength(8)
    @MaxLength(100)
    clientRequestId!: string
}
