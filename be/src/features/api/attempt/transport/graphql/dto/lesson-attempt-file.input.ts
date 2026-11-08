import { Field, InputType } from "@nestjs/graphql"
import { IsString, MaxLength } from "class-validator"

@InputType()
/** A file a learner submits with an exercise. */
export class LessonAttemptFileInput {
    /** The path inside the exercise. */
    @Field(() => String)
    @IsString()
    @MaxLength(200)
    relativePath!: string

    /** The file text. */
    @Field(() => String)
    @IsString()
    @MaxLength(100000)
    content!: string
}
