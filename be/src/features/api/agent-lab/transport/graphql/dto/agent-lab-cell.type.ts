import { Field, ObjectType } from "@nestjs/graphql"
import { AgentLabStepType } from "./agent-lab-step.type"

@ObjectType()
/** One cell of a track grid: a concept on the track and its lab. */
export class AgentLabCellType {
    /** The concept id. */
    @Field(() => String)
    conceptId!: string

    /** The concept name in the asked locale. */
    @Field(() => String)
    conceptLabel!: string

    /** The lab id, or null while the lab is not written. */
    @Field(() => String, { nullable: true })
    labId!: string | null

    /** `being-written`, `draft`, `approved` or `outdated`. */
    @Field(() => String)
    status!: string

    /** The lab title, or null while it is not written. */
    @Field(() => String, { nullable: true })
    title!: string | null

    /** Whether the concept needs Premium and the learner holds none. */
    @Field(() => Boolean)
    locked!: boolean

    /** Whether the learner can follow the lab now. */
    @Field(() => Boolean)
    open!: boolean

    /** The steps; empty unless the lab is open. */
    @Field(() => [AgentLabStepType])
    steps!: ReadonlyArray<AgentLabStepType>
}
