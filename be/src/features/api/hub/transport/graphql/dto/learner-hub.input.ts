import { Field, InputType } from "@nestjs/graphql"
import { IsIn } from "class-validator"
import type { HubLocale } from "@modules/domain/hub"

@InputType()
/** The hub query: the locale of its labels and titles. */
export class LearnerHubInput {
    /** The locale of the labels and titles. */
    @Field(() => String, { defaultValue: "vi" })
    @IsIn(["vi", "en"])
    locale: HubLocale = "vi"
}
