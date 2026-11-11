import { Field, ObjectType } from "@nestjs/graphql"
import { LessonAttemptFileType } from "./lesson-attempt-file.type"

@ObjectType()
/** What the learner answered, as stored; only the fields of the activity kind are set. It is the learner's own answer, read back after a reload. */
export class LessonAttemptAnswerType {
    /** The option picked in a choice. */
    @Field(() => String, { nullable: true })
    optionId!: string | null

    /** The written explanation of an explain or exercise activity. */
    @Field(() => String, { nullable: true })
    text!: string | null

    /** The actions taken in a simulation, from its initial state. */
    @Field(() => [String], { nullable: true })
    actionIds!: ReadonlyArray<string> | null

    /** The state a simulation path reached. */
    @Field(() => String, { nullable: true })
    reachedStateId!: string | null

    /** The answer to the debrief question of a simulation. */
    @Field(() => String, { nullable: true })
    debrief!: string | null

    /** The files of an exercise. */
    @Field(() => [LessonAttemptFileType], { nullable: true })
    files!: ReadonlyArray<LessonAttemptFileType> | null
}
