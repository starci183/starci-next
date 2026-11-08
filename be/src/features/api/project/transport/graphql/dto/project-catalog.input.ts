import { Field, InputType } from "@nestjs/graphql"
import { IsIn } from "class-validator"
import type { ProjectLocale } from "@modules/domain/project"

@InputType()
/** The catalog: the locale of the text. */
export class ProjectCatalogInput {
    /** The locale of the text; Vietnamese when left out. */
    @Field(() => String, { defaultValue: "vi" })
    @IsIn(["vi", "en"])
    locale: ProjectLocale = "vi"
}
