import { Field, ObjectType } from "@nestjs/graphql"
import { LessonExerciseFileType } from "./lesson-exercise-file.type"

@ObjectType()
/** An exercise as the learner receives it. */
export class LessonExerciseType {
    /** What to submit. */
    @Field(() => String)
    submissionInstructions!: string

    /** The files handed over. */
    @Field(() => [LessonExerciseFileType])
    files!: ReadonlyArray<LessonExerciseFileType>
}
