import { Field, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** An Essentials lesson a gap links to. */
export class InterviewLessonLinkType {
    /** The lesson id. */
    @Field(() => String)
    lessonId!: string

    /** The topic the lesson sits under. */
    @Field(() => String)
    topic!: string

    /** The title. */
    @Field(() => String)
    title!: string
}
