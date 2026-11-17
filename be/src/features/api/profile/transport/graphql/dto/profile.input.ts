import { Field, InputType } from "@nestjs/graphql"
import { IsIn } from "class-validator"
import type { ProfileLocale } from "@modules/domain/profile"

@InputType()
/** The profile query and the avatar removal: the locale of the goal title. */
export class ProfileInput {
    /** The locale of the goal title. */
    @Field(() => String, { defaultValue: "vi" })
    @IsIn(["vi", "en"])
    locale: ProfileLocale = "vi"
}
