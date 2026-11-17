import { Field, Float, Int, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** The budget of one trial run. */
export class HarnessBudgetType {
    /** The most the run may cost, in USD. */
    @Field(() => Float)
    maxUsd!: number

    /** The most turns. */
    @Field(() => Int)
    maxTurns!: number

    /** The most seconds. */
    @Field(() => Int)
    timeoutSec!: number
}
