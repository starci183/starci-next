import { Field, Int, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** What the learner may do now. */
export class InterviewAccessType {
    /** Whether the learner holds Premium. */
    @Field(() => Boolean)
    isPremium!: boolean

    /** Free sessions left. */
    @Field(() => Int)
    freeSessionsLeftThisMonth!: number

    /** When the free quota resets. */
    @Field(() => String)
    resetsAt!: string

    /** Questions in a session of this learner. */
    @Field(() => Int)
    length!: number
}
