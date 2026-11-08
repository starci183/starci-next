import { Field, InputType, Int } from "@nestjs/graphql"
import { IsInt, Max, Min } from "class-validator"

@InputType()
/** The daily item goal. */
export class SetRecallGoalInput {
    /** The items a day, 5 to 50. */
    @Field(() => Int)
    @IsInt()
    @Min(-1000)
    @Max(1000)
    daily!: number
}
