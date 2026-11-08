import { Field, InputType, Int } from "@nestjs/graphql"
import { IsInt, IsOptional, ValidateNested } from "class-validator"
import { Type } from "class-transformer"
import { StreakReminderInput } from "./streak-reminder.input"

@InputType()
/** The weekly goal a learner sets; the range 2 to 7 is checked by the streak capability. */
export class SetStreakGoalInput {
    /** The active days a week. */
    @Field(() => Int)
    @IsInt()
    activeDays!: number

    /** The reminder, when the learner sets one. */
    @Field(() => StreakReminderInput, { nullable: true })
    @IsOptional()
    @ValidateNested()
    @Type(() => StreakReminderInput)
    reminder?: StreakReminderInput | null
}
