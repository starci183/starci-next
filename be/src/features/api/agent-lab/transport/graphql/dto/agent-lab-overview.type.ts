import { Field, ObjectType } from "@nestjs/graphql"
import { AgentLabConceptType } from "./agent-lab-concept.type"
import { AgentLabTrackSummaryType } from "./agent-lab-track-summary.type"

@ObjectType()
/** The overview of the lab area: the tracks and the seven mindset concepts. */
export class AgentLabOverviewType {
    /** The tracks. */
    @Field(() => [AgentLabTrackSummaryType])
    tracks!: ReadonlyArray<AgentLabTrackSummaryType>

    /** The seven mindset concepts. */
    @Field(() => [AgentLabConceptType])
    concepts!: ReadonlyArray<AgentLabConceptType>
}
