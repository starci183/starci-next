import { Field, InputType } from "@nestjs/graphql"
import { IsString, Matches, MaxLength } from "class-validator"

@InputType()
/** The article section the learner read. */
export class MarkLessonSectionReadInput {
    /** The lesson id, a lowercase slug. */
    @Field(() => String)
    @IsString()
    @MaxLength(100)
    @Matches(/^[a-z0-9][a-z0-9-]*$/u)
    lessonId!: string

    /** The section id. */
    @Field(() => String)
    @IsString()
    @MaxLength(100)
    @Matches(/^[A-Za-z0-9][A-Za-z0-9._-]*$/u)
    sectionId!: string
}
