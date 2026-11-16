import { Field, Int, ObjectType } from "@nestjs/graphql"
import { ProgressPartType } from "./progress-part.type"
import { ProgressTopicType } from "./progress-topic.type"

@ObjectType()
/** The Essentials section of the progress page. */
export class ProgressEssentialsType {
    /** Lessons finished. */
    @Field(() => Int)
    lessonsDone!: number

    /** Lessons opened. */
    @Field(() => Int)
    lessonsStarted!: number

    /** Lessons in the catalog. */
    @Field(() => Int)
    lessonsTotal!: number

    /** Opener questions right before the lesson, over every lesson answered. */
    @Field(() => Int)
    beforeCorrect!: number

    /** Opener questions right now. */
    @Field(() => Int)
    afterCorrect!: number

    /** Opener questions answered. */
    @Field(() => Int)
    answered!: number

    /** The topics the learner touched first, then the rest. */
    @Field(() => [ProgressTopicType])
    topics!: Array<ProgressTopicType>

    /** The four parts and whether the plan opens each. */
    @Field(() => [ProgressPartType])
    parts!: Array<ProgressPartType>
}
