import { Field, Int, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** The Review section of the progress page. */
export class ProgressReviewType {
    /** Items due. */
    @Field(() => Int)
    due!: number

    /** The part of due before today. */
    @Field(() => Int)
    overdue!: number

    /** Items done today. */
    @Field(() => Int)
    doneToday!: number

    /** The daily goal. */
    @Field(() => Int)
    goalDaily!: number

    /** The current streak. */
    @Field(() => Int)
    streak!: number

    /** The best streak. */
    @Field(() => Int)
    longestStreak!: number

    /** Whether today counts. */
    @Field(() => Boolean)
    todayCounted!: boolean
}
