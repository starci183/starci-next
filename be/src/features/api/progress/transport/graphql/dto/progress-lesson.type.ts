import { Field, Int, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** One lesson of a topic with its opener. */
export class ProgressLessonType {
    /** The lesson id. */
    @Field(() => String)
    lessonId!: string

    /** The title. */
    @Field(() => String)
    title!: string

    /** Whether the learner finished it. */
    @Field(() => Boolean)
    done!: boolean

    /** Whether the learner opened it. */
    @Field(() => Boolean)
    started!: boolean

    /** Questions of the opener. */
    @Field(() => Int)
    openerTotal!: number

    /** Questions answered. */
    @Field(() => Int)
    openerAnswered!: number

    /** Questions right before the lesson, or null while none was answered. */
    @Field(() => Int, { nullable: true })
    before!: number | null

    /** Questions right now, or null while none was answered. */
    @Field(() => Int, { nullable: true })
    after!: number | null
}
