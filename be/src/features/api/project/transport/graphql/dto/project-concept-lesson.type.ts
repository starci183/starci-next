import { Field, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** The Essentials lesson a concept routes the learner to. */
export class ProjectConceptLessonType {
    /** The lesson id. */
    @Field(() => String)
    id!: string

    /** The topic slug of the lesson. */
    @Field(() => String)
    topicId!: string

    /** The title in the locale of the request. */
    @Field(() => String)
    title!: string
}
