import { Field, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** A related topic of the topic page: linkable only while it has a published lesson. */
export class LessonRelatedTopicType {
    /** The topic slug. */
    @Field(() => String)
    id!: string

    /** The title; the slug while the topic is not stored. */
    @Field(() => String)
    title!: string

    /** True only when the topic has a published lesson. */
    @Field(() => Boolean)
    listed!: boolean
}
