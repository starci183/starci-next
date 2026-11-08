import { Field, Int, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** A track as the overview lists it. */
export class AgentLabTrackSummaryType {
    /** The track id. */
    @Field(() => String)
    id!: string

    /** The tool name. */
    @Field(() => String)
    label!: string

    /** One line on the tool. */
    @Field(() => String)
    focus!: string

    /** `starci-proxy` (StarCi pays, capped) or `byo` (the learner's own account). */
    @Field(() => String)
    keyMode!: string

    /** The tool version the labs are pinned to, or null before the teacher pins one. */
    @Field(() => String, { nullable: true })
    pinnedVersion!: string | null

    /** How many labs exist for the track. */
    @Field(() => Int)
    labCount!: number

    /** How many labs the learner can open now. */
    @Field(() => Int)
    openLabCount!: number
}
