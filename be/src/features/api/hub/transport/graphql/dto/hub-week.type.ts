import { Field, ObjectType, Int } from "@nestjs/graphql"

@ObjectType()
/** This week so far and its goal. */
export class HubWeekType {
    /** The days with a meaningful action since Monday. */
    @Field(() => Int)
    activeDays!: number

    /** The weekly goal in active days. */
    @Field(() => Int)
    goal!: number
}
