import { Field, InputType } from "@nestjs/graphql"
import { IsIn, IsOptional } from "class-validator"
import type { ExperienceState } from "@modules/domain/career"

/** The states a list may ask for. */
const EXPERIENCE_STATES: ReadonlyArray<ExperienceState> = [
    "practising",
    "ai-graded",
    "pending-review",
    "verified",
    "returned",
    "revoked",
]

@InputType()
/** Which items the learner lists. */
export class MyExperienceInput {
    /** The state to list; every item when left out. */
    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsIn(EXPERIENCE_STATES)
    state: ExperienceState | null = null
}
