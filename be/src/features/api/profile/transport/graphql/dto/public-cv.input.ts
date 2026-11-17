import { Field, InputType } from "@nestjs/graphql"
import { IsIn, IsString, Matches, MaxLength } from "class-validator"
import type { ProfileLocale } from "@modules/domain/profile"

@InputType()
/** The public CV to read. */
export class PublicCvInput {
    /** The slug of the CV link. */
    @Field(() => String)
    @IsString()
    @MaxLength(60)
    @Matches(/^[a-z0-9]+(-[a-z0-9]+)*$/u)
    slug!: string

    /** The locale of the lines; Vietnamese when left out. */
    @Field(() => String, { defaultValue: "vi" })
    @IsIn(["vi", "en"])
    locale: ProfileLocale = "vi"
}
