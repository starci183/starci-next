import { Field, InputType } from "@nestjs/graphql"
import { IsString, Matches, MaxLength } from "class-validator"

@InputType()
/** The public code of /verify/{code}. */
export class VerifyExperienceInput {
    /** The code, three groups of four letters and digits. */
    @Field(() => String)
    @IsString()
    @MaxLength(20)
    @Matches(/^[A-Za-z0-9]{4}-[A-Za-z0-9]{4}-[A-Za-z0-9]{4}$/u)
    code!: string
}
