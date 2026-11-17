import { Field, InputType } from "@nestjs/graphql"
import { IsString, Matches, MaxLength } from "class-validator"

@InputType()
/** The practice pattern whose experience the learner claims. */
export class ClaimPracticeExperienceInput {
    /** The pattern id, the subject of the practice item. */
    @Field(() => String)
    @IsString()
    @MaxLength(40)
    @Matches(/^[A-Za-z][A-Za-z0-9]*$/u)
    patternId!: string
}
