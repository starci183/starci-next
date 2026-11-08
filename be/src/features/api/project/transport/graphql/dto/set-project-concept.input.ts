import { Field, InputType } from "@nestjs/graphql"
import { IsIn, IsOptional, IsString, IsUUID, MaxLength, MinLength } from "class-validator"
import type { ProjectLocale } from "@modules/domain/project"

@InputType()
/** Where a concept shows in a project; a field left out stays as it is. */
export class SetProjectConceptInput {
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

    /** The code location, path or path#symbol. */
    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    @MaxLength(300)
    location: string | null = null

    /** The endpoint the probes aim at, METHOD /path. */
    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    @MaxLength(200)
    endpoint: string | null = null

    /** The JSON body the probes send. */
    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    @MaxLength(2000)
    sampleBody: string | null = null

    /** The locale of the text; Vietnamese when left out. */
    @Field(() => String, { defaultValue: "vi" })
    @IsIn(["vi", "en"])
    locale: ProjectLocale = "vi"
}
