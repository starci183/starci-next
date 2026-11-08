import { Field, InputType } from "@nestjs/graphql"
import { IsIn, IsOptional, IsString, MaxLength, MinLength } from "class-validator"
import type { ProjectKind, ProjectLocale } from "@modules/domain/project"

@InputType()
/** A new project of the learner: any topic, language and stack. */
export class CreateProjectInput {
    /** The name. */
    @Field(() => String)
    @IsString()
    @MinLength(1)
    @MaxLength(80)
    name!: string

    /** app or agent. */
    @Field(() => String)
    @IsIn(["app", "agent"])
    kind!: ProjectKind

    /** The topic. */
    @Field(() => String, { defaultValue: "" })
    @IsString()
    @MaxLength(120)
    topic: string = ""

    /** The main language. */
    @Field(() => String, { defaultValue: "" })
    @IsString()
    @MaxLength(40)
    language: string = ""

    /** The stack line. */
    @Field(() => String, { defaultValue: "" })
    @IsString()
    @MaxLength(120)
    stack: string = ""

    /** The agent tool track of an agent project: claude, openclaw or hermes. */
    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    @MaxLength(16)
    track: string | null = null

    /** The repository address. */
    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    @MaxLength(300)
    repoUrl: string | null = null

    /** The locale of the text; Vietnamese when left out. */
    @Field(() => String, { defaultValue: "vi" })
    @IsIn(["vi", "en"])
    locale: ProjectLocale = "vi"
}
