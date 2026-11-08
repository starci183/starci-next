import { Field, InputType } from "@nestjs/graphql"
import { IsIn, IsUUID, MaxLength } from "class-validator"
import type { ProjectLocale } from "@modules/domain/project"

@InputType()
/** One project to read. */
export class ProjectInput {
    /** The project. */
    @Field(() => String)
    @IsUUID()
    @MaxLength(36)
    projectId!: string

    /** The locale of the text; Vietnamese when left out. */
    @Field(() => String, { defaultValue: "vi" })
    @IsIn(["vi", "en"])
    locale: ProjectLocale = "vi"
}
