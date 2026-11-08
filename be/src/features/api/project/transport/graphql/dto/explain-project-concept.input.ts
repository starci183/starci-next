import { Field, InputType } from "@nestjs/graphql"
import { IsIn, IsString, IsUUID, MaxLength, MinLength } from "class-validator"
import type { ProjectLocale } from "@modules/domain/project"

@InputType()
/** The code a learner points to and their explanation, for the AI teacher to read. */
export class ExplainProjectConceptInput {
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

    /** The code location the excerpt comes from. */
    @Field(() => String)
    @IsString()
    @MinLength(1)
    @MaxLength(300)
    location!: string

    /** The code the learner points to. */
    @Field(() => String)
    @IsString()
    @MinLength(1)
    @MaxLength(12000)
    excerpt!: string

    /** Their two or three sentences. */
    @Field(() => String)
    @IsString()
    @MinLength(1)
    @MaxLength(1000)
    explanation!: string

    /** The locale of the text; Vietnamese when left out. */
    @Field(() => String, { defaultValue: "vi" })
    @IsIn(["vi", "en"])
    locale: ProjectLocale = "vi"
}
