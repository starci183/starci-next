import { Field, InputType } from "@nestjs/graphql"
import { IsString, Matches, MaxLength } from "class-validator"

@InputType()
/** The lesson whose progress is read. */
export class LessonProgressInput {
    /** The lesson id, a lowercase slug. */
    @Field(() => String)
    @IsString()
    @MaxLength(100)
    @Matches(/^[a-z0-9][a-z0-9-]*$/u)
    lessonId!: string
}
