import { Field, Int, ObjectType } from "@nestjs/graphql"
import { RecallGoalType } from "./recall-goal.type"

@ObjectType()
/** What a self-grade did. */
export class RecallGradeType {
    /** The item id. */
    @Field(() => String)
    itemId!: string

    /** The new status. */
    @Field(() => String)
    status!: string

    /** The new ladder step. */
    @Field(() => Int)
    step!: number

    /** The day it is due again. */
    @Field(() => String)
    dueOn!: string

    /** The goal and what is done today. */
    @Field(() => RecallGoalType)
    goal!: RecallGoalType

    /** Items still due today. */
    @Field(() => Int)
    remainingToday!: number
}
