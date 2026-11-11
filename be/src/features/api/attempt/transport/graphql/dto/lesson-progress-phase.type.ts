import { Field, Int, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** One phase of the lesson: open or done, and how many of its activities the learner finished. */
export class LessonProgressPhaseType {
    /** challenge, predict, explore, explain, apply or reflect. */
    @Field(() => String)
    phase!: string

    /** open or done. */
    @Field(() => String)
    state!: string

    /** The activities of the phase the learner finished. */
    @Field(() => Int)
    done!: number

    /** The activities of the phase. */
    @Field(() => Int)
    total!: number
}
