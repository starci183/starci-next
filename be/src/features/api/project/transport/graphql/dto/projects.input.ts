import { Field, InputType } from "@nestjs/graphql"
import { IsIn } from "class-validator"
import type { ProjectLocale } from "@modules/domain/project"

@InputType()
/** The project list: the locale of the text. */
export class ProjectsInput {
    /** The locale of the text; Vietnamese when left out. */
    @Field(() => String, { defaultValue: "vi" })
    @IsIn(["vi", "en"])
    locale: ProjectLocale = "vi"
}
