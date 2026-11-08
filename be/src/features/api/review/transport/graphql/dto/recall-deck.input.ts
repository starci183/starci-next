import { Field, InputType } from "@nestjs/graphql"
import { IsString, Matches, MaxLength } from "class-validator"

@InputType()
/** The deck to add or remove. */
export class RecallDeckInput {
    /** The deck id, course folder and deck folder. */
    @Field(() => String)
    @IsString()
    @MaxLength(200)
    @Matches(/^[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+$/u)
    deckId!: string
}
