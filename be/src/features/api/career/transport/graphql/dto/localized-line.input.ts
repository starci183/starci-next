import { Field, InputType } from "@nestjs/graphql"
import { IsString, MaxLength, MinLength } from "class-validator"

@InputType()
/** A line in both locales. */
export class LocalizedLineInput {
    /** The Vietnamese line. */
    @Field(() => String)
    @IsString()
    @MinLength(1)
    @MaxLength(600)
    vi!: string

    /** The English line. */
    @Field(() => String)
    @IsString()
    @MinLength(1)
    @MaxLength(600)
    en!: string
}
