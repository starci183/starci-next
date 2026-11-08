import { Field, ObjectType } from "@nestjs/graphql"
import { LessonRelatedTopicType } from "./lesson-related-topic.type"
import { LessonTopicStepType } from "./lesson-topic-step.type"

@ObjectType()
/** The topic page: the topic, its group and its path of lessons. */
export class LessonTopicType {
    /** The topic slug. */
    @Field(() => String)
    id!: string

    /** The title. */
    @Field(() => String)
    title!: string

    /** The catalog group of the topic. */
    @Field(() => String)
    group!: string

    /** Where the topic comes from. */
    @Field(() => String)
    from!: string

    /** What the topic covers, or null. */
    @Field(() => String, { nullable: true })
    description!: string | null

    /** What a learner should know first, or null. */
    @Field(() => [String], { nullable: true })
    prerequisites!: ReadonlyArray<string> | null

    /** The related topics, or null; a topic is listed only once it has a published lesson. */
    @Field(() => [LessonRelatedTopicType], { nullable: true })
    related!: ReadonlyArray<LessonRelatedTopicType> | null

    /** The path rows in the teacher's order. */
    @Field(() => [LessonTopicStepType])
    path!: ReadonlyArray<LessonTopicStepType>
}
