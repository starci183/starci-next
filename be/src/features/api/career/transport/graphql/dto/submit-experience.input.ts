import { Field, InputType } from "@nestjs/graphql"
import { Type } from "class-transformer"
import { IsUUID, ValidateNested, MaxLength } from "class-validator"
import { LocalizedLineInput } from "./localized-line.input"

@InputType()
/** What a learner sends for review. */
export class SubmitExperienceInput {
    /** The item. */
    @Field(() => String)
    @MaxLength(40)
    @IsUUID()
    itemId!: string

    /** The line: the draft, or a rewording that keeps every value from the evidence. */
    @Field(() => LocalizedLineInput)
    @ValidateNested()
    @Type(() => LocalizedLineInput)
    line!: LocalizedLineInput
}
