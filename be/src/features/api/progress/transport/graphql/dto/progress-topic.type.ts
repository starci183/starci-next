import { Field, Int, ObjectType } from "@nestjs/graphql"
import { ProgressLessonType } from "./progress-lesson.type"

@ObjectType()
/** One topic of Essentials. */
export class ProgressTopicType {
    /** The topic id. */
    @Field(() => String)
    topicId!: string

    /** The title. */
    @Field(() => String)
    title!: string

    /** Lessons finished. */
    @Field(() => Int)
    lessonsDone!: number

    /** Lessons in the topic. */
    @Field(() => Int)
    lessonsTotal!: number

    /** The lessons in the catalog order. */
    @Field(() => [ProgressLessonType])
    lessons!: Array<ProgressLessonType>
}
