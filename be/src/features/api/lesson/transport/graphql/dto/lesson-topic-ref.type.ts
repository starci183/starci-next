import { Field, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** The topic a lesson belongs to. */
export class LessonTopicRefType {
    /** The topic slug. */
    @Field(() => String)
    id!: string

    /** The topic title. */
    @Field(() => String)
    title!: string
}
