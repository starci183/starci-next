import { Field, Int, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** The attempts of one learner in one lesson, counted. */
export class LessonProgressAttemptsType {
    /** Every attempt made. */
    @Field(() => Int)
    total!: number

    /** The activities attempted. */
    @Field(() => Int)
    activities!: number

    /** The activities whose newest attempt is graded. */
    @Field(() => Int)
    graded!: number

    /** The activities whose newest attempt failed. */
    @Field(() => Int)
    failed!: number

    /** The activities whose newest attempt is saved or being graded. */
    @Field(() => Int)
    pending!: number
}
