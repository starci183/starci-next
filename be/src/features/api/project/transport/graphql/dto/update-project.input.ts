import { Field, InputType } from "@nestjs/graphql"
import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from "class-validator"
import type { ProjectLocale } from "@modules/domain/project"

@InputType()
/** Changes to a project; a field left out stays as it is. */
export class UpdateProjectInput {
    /** The project. */
    @Field(() => String)
    @IsUUID()
    @MaxLength(36)
    projectId!: string

    /** The new name. */
    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    @MaxLength(80)
    name: string | null = null

    /** The new topic. */
    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    @MaxLength(120)
    topic: string | null = null

    /** The new main language. */
    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    @MaxLength(40)
    language: string | null = null

    /** The new stack line. */
    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    @MaxLength(120)
    stack: string | null = null

    /** The new repository address; an empty text clears it. */
    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    @MaxLength(300)
    repoUrl: string | null = null

    /** The new deployed address; an empty text clears it. */
    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    @MaxLength(300)
    deployedUrl: string | null = null

    /** The locale of the text; Vietnamese when left out. */
    @Field(() => String, { defaultValue: "vi" })
    @IsIn(["vi", "en"])
    locale: ProjectLocale = "vi"
}
