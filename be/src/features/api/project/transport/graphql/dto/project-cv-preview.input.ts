import { Field, InputType } from "@nestjs/graphql"
import { IsIn, IsOptional, IsString, IsUUID, MaxLength, MinLength } from "class-validator"
import type { ProjectLocale } from "@modules/domain/project"

@InputType()
/** One concept or one milestone of a project whose CV line to preview; exactly one of the two is named. */
export class ProjectCvPreviewInput {
    /** The project. */
    @Field(() => String)
    @IsUUID()
    @MaxLength(36)
    projectId!: string

    /** The concept to preview, or left out when a milestone is named. */
    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(64)
    conceptId?: string | null

    /** The milestone to preview, or left out when a concept is named. */
    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(64)
    milestoneId?: string | null

    /** The locale of the line; Vietnamese when left out. */
    @Field(() => String, { defaultValue: "vi" })
    @IsIn(["vi", "en"])
    locale: ProjectLocale = "vi"
}
