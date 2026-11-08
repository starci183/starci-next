import { Field, InputType } from "@nestjs/graphql"
import { IsBoolean, IsString, MaxLength } from "class-validator"

@InputType()
/** The reminder a learner sets; the time is checked by the streak capability. */
export class StreakReminderInput {
    /** Whether a reminder is wanted. */
    @Field(() => Boolean)
    @IsBoolean()
    enabled!: boolean

    /** The local time, HH:MM. */
    @Field(() => String)
    @IsString()
    @MaxLength(5)
    localTime!: string
}
