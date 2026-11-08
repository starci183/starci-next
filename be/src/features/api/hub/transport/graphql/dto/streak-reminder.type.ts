import { Field, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** The reminder a learner set; it is stored only. */
export class StreakReminderType {
    /** Whether a reminder is wanted. */
    @Field(() => Boolean)
    enabled!: boolean

    /** The local time, HH:MM. */
    @Field(() => String)
    localTime!: string
}
