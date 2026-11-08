import { Field, InputType } from "@nestjs/graphql"
import { IsBoolean, IsUUID, MaxLength } from "class-validator"

@InputType()
/** Whether a verified item shows on the public profile. */
export class ShowExperienceInput {
    /** The item. */
    @Field(() => String)
    @MaxLength(40)
    @IsUUID()
    itemId!: string

    /** Whether it shows. */
    @Field(() => Boolean)
    @IsBoolean()
    shownPublicly!: boolean
}
