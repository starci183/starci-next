import { Field, InputType } from "@nestjs/graphql"
import { IsString, MaxLength, MinLength } from "class-validator"

@InputType()
/** The path a learner chooses; whether the id is in the catalog is checked by the path capability. */
export class ChooseOutcomePathInput {
    /** The path id. */
    @Field(() => String)
    @IsString()
    @MinLength(1)
    @MaxLength(64)
    pathId!: string
}
