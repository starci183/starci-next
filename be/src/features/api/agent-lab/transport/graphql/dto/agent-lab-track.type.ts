import { Field, Int, ObjectType } from "@nestjs/graphql"
import { AgentLabCellType } from "./agent-lab-cell.type"

@ObjectType()
/** One track with the grid of its labs. */
export class AgentLabTrackType {
    /** The track id. */
    @Field(() => String)
    id!: string

    /** The tool name. */
    @Field(() => String)
    label!: string

    /** One line on the tool. */
    @Field(() => String)
    focus!: string

    /** `starci-proxy` or `byo`. */
    @Field(() => String)
    keyMode!: string

    /** The tool version the labs are pinned to, or null. */
    @Field(() => String, { nullable: true })
    pinnedVersion!: string | null

    /** How many labs exist for the track. */
    @Field(() => Int)
    labCount!: number

    /** How many labs the learner can open now. */
    @Field(() => Int)
    openLabCount!: number

    /** One cell per concept. */
    @Field(() => [AgentLabCellType])
    cells!: ReadonlyArray<AgentLabCellType>
}
