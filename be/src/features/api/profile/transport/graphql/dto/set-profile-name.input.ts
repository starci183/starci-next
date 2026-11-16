import { Field, InputType } from "@nestjs/graphql"
import { IsIn, IsOptional, IsString, MaxLength } from "class-validator"
import type { ProfileLocale } from "@modules/domain/profile"

@InputType()
/** The display name a learner sets; an empty or null name clears it. The length limit is checked again by the profile capability. */
export class SetProfileNameInput {
    /** The new display name, or null to clear it. */
    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    @MaxLength(200)
    displayName: string | null = null

    /** The locale of the answer. */
    @Field(() => String, { defaultValue: "vi" })
    @IsIn(["vi", "en"])
    locale: ProfileLocale = "vi"
}
