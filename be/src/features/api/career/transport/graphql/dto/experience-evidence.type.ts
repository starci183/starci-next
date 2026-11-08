import { Field, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** One piece of StarCi evidence an item rests on. */
export class ExperienceEvidenceType {
    /** What it is: a lesson result, a CI run, a probe run, a transcript. */
    @Field(() => String)
    kind!: string

    /** The StarCi reference of the evidence. */
    @Field(() => String)
    ref!: string

    /** How it was proved. */
    @Field(() => String)
    proofForm!: string

    /** When it was produced, as an ISO 8601 instant. */
    @Field(() => String)
    at!: string
}
