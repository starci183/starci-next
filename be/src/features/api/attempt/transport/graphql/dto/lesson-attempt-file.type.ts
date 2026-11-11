import { Field, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** A file the learner submitted with an exercise, as stored. */
export class LessonAttemptFileType {
    /** The path inside the exercise. */
    @Field(() => String)
    relativePath!: string

    /** The file text. */
    @Field(() => String)
    content!: string
}
