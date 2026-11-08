import { Field, InputType } from "@nestjs/graphql"
import { Type } from "class-transformer"
import { ArrayMaxSize, ArrayMinSize, IsArray, ValidateNested } from "class-validator"
import { ReviewDecisionItemInput } from "./review-decision-item.input"

@InputType()
/** A batch of decisions; each item is applied on its own. */
export class DecideExperienceInput {
    /** The decisions. */
    @Field(() => [ReviewDecisionItemInput])
    @IsArray()
    @ArrayMinSize(1)
    @ArrayMaxSize(50)
    @ValidateNested({ each: true })
    @Type(() => ReviewDecisionItemInput)
    decisions!: Array<ReviewDecisionItemInput>
}
