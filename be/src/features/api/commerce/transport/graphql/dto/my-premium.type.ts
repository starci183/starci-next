import { Field, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** The learner Premium standing for the plans screen. */
export class MyPremiumType {
    /** Whether Premium access is active now. */
    @Field(() => Boolean)
    isPremium!: boolean

    /** The stored Premium end; null when the learner never held Premium. */
    @Field(() => String, { nullable: true })
    premiumUntil!: string | null

    /** The rail of the learner latest order, to preselect; null when they never bought. */
    @Field(() => String, { nullable: true })
    lastRail!: string | null
}
