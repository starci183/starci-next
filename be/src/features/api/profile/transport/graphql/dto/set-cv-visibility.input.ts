import { Field, InputType } from "@nestjs/graphql"
import { IsBoolean } from "class-validator"

@InputType()
/** Makes the CV of the learner public or private. */
export class SetCvVisibilityInput {
    /** Whether anyone with the link can open the CV. */
    @Field(() => Boolean)
    @IsBoolean()
    isPublic!: boolean
}
