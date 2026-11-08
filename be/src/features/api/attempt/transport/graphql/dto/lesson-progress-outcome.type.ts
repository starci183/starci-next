import { Field, Int, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** The levels one learner reached for one learning outcome. */
export class LessonProgressOutcomeType {
    /** The outcome id. */
    @Field(() => String)
    id!: string

    /** What the learner showed to understand, 0 to 2. */
    @Field(() => Int)
    understood!: number

    /** What the learner proved by applying it, 0 to 2. */
    @Field(() => Int)
    proved!: number
}
