import { Field, InputType, Int } from "@nestjs/graphql"
import { IsInt, IsOptional, Max, Min } from "class-validator"

@InputType()
/** The statistics to read. */
export class RecallStatsInput {
    /** How many days to look back; 28 when left out. */
    @Field(() => Int, { nullable: true })
    @IsOptional()
    @IsInt()
    @Min(7)
    @Max(365)
    days?: number | null
}
