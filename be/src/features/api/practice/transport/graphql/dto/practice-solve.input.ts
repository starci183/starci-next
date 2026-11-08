import { Field, InputType } from "@nestjs/graphql"
import { IsIn, IsString, Matches, MaxLength } from "class-validator"

/** The wire names of the languages a solution can be written in. */
export const PRACTICE_LANGUAGE_WIRES = ["CPP", "JAVA", "JAVASCRIPT", "PYTHON", "TYPESCRIPT"] as const

/** The wire name of one language. */
export type PracticeLanguageWire = (typeof PRACTICE_LANGUAGE_WIRES)[number]

@InputType()
/** A solution to run or submit. */
export class PracticeSolveInput {
    /** The problem slug. */
    @Field(() => String)
    @IsString()
    @MaxLength(100)
    @Matches(/^[a-z0-9][a-z0-9-]*$/u)
    slug!: string

    /** The language of the source. */
    @Field(() => String)
    @IsIn(PRACTICE_LANGUAGE_WIRES)
    language!: PracticeLanguageWire

    /** The source code; a submission has a size limit. */
    @Field(() => String)
    @IsString()
    @MaxLength(200000)
    source!: string
}
