import { Field, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** A file an exercise hands the learner. */
export class LessonExerciseFileType {
    /** The path inside the exercise. */
    @Field(() => String)
    relativePath!: string

    /** The role of the file. */
    @Field(() => String)
    role!: string

    /** The language the editor highlights. */
    @Field(() => String)
    syntaxLanguage!: string

    /** The file text. */
    @Field(() => String)
    content!: string
}
