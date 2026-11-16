import { Field, InputType } from "@nestjs/graphql"
import { IsIn, IsString, IsUUID, MaxLength, MinLength } from "class-validator"
import type { ProjectLocale } from "@modules/domain/project"

@InputType()
/** One concept of a project to read. */
export class ProjectConceptInput {
    /** The project. */
    @Field(() => String)
    @IsUUID()
    @MaxLength(36)
    projectId!: string

    /** The concept. */
    @Field(() => String)
    @IsString()
    @MinLength(1)
    @MaxLength(64)
    conceptId!: string

    /** The locale of the text; Vietnamese when left out. */
    @Field(() => String, { defaultValue: "vi" })
    @IsIn(["vi", "en"])
    locale: ProjectLocale = "vi"
}
