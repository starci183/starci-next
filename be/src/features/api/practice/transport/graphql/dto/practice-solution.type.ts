import { Field, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** The reference solution of a problem after the learner revealed it. */
export class PracticeSolutionType {
    /** The problem slug. */
    @Field(() => String)
    slug!: string

    /** The reference solution in markdown, in the asked locale, with fenced code. */
    @Field(() => String)
    solution!: string

    /** When the learner first revealed it, an ISO instant. */
    @Field(() => String)
    revealedAt!: string

    /** Whether the problem still counts toward experience: false when the reveal came before the first Accepted. */
    @Field(() => Boolean)
    countedForExperience!: boolean
}
