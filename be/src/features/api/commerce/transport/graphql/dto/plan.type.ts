import { Field, Int, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** One server-owned Premium offer the plans screen lists. */
export class PlanType {
    /** The plan the learner selects. */
    @Field(() => String)
    plan!: string

    /** The entitlement term a paid purchase of this offer grants. */
    @Field(() => String)
    term!: string

    /** The fixed price in whole VND. */
    @Field(() => Int)
    amountVnd!: number

    /** The currency of the price; always VND. */
    @Field(() => String)
    currency!: string
}
