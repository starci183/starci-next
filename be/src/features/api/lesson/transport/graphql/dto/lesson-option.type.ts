import { Field, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** A choice option as the learner sees it before a submit: no correctness and no explanation. */
export class LessonOptionType {
    /** The stable id. */
    @Field(() => String)
    id!: string

    /** The option text. */
    @Field(() => String)
    label!: string
}
