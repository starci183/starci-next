import { Field, ObjectType, Int } from "@nestjs/graphql"
import { StreakReminderType } from "./streak-reminder.type"

@ObjectType()
/** The weekly goal and the reminder after a change. */
export class StreakGoalType {
    /** The weekly goal in active days. */
    @Field(() => Int)
    weeklyGoal!: number

    /** The reminder, or null. */
    @Field(() => StreakReminderType, { nullable: true })
    reminder!: StreakReminderType | null
}
