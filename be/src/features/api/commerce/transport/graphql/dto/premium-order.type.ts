import { Field, ID, Int, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** One order of the learner and its server-derived state. */
export class PremiumOrderType {
    /** The order identifier. */
    @Field(() => ID)
    orderId!: string

    /** The display state: verifying, active, failed or expired; derived from the stored purchase, never from a return URL. */
    @Field(() => String)
    status!: string

    /** The plan the order bought. */
    @Field(() => String)
    plan!: string

    /** The price snapshot in whole VND. */
    @Field(() => Int)
    amountVnd!: number

    /** The rail the order runs on: sepay or payos. */
    @Field(() => String)
    rail!: string

    /** The order reference the provider shows and echoes. */
    @Field(() => String)
    orderCode!: string

    /** The learner Premium end once the order is active, otherwise null. */
    @Field(() => String, { nullable: true })
    premiumUntil!: string | null
}
