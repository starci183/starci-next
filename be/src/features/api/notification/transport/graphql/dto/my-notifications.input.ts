import { Field, InputType, Int } from "@nestjs/graphql"
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from "class-validator"

@InputType()
/** The myNotifications arguments: the cursor of the page before and the most rows wanted. */
export class MyNotificationsInput {
    /** The cursor the page before answered; absent, the first page. */
    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    @MaxLength(2048)
    after: string | null = null

    /** The most notifications wanted: 20 when absent, at most 50. */
    @Field(() => Int, { nullable: true })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(50)
    limit: number | null = null
}
