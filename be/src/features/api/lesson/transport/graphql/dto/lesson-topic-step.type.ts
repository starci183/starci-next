import { Field, Int, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** One row of a topic path: a lesson of the topic or a lesson still to come. */
export class LessonTopicStepType {
    /** The position in the path, from 1. */
    @Field(() => Int)
    order!: number

    /** The title. */
    @Field(() => String)
    title!: string

    /** The published lesson of this row, or null for a row that is still to come. */
    @Field(() => String, { nullable: true })
    lessonId!: string | null
}
