import { Field, ObjectType } from "@nestjs/graphql"
import { ProjectProbeResultType } from "./project-probe-result.type"

@ObjectType()
/** One run of the probes against a deployed address. */
export class ProjectProbeRunType {
    /** The run id. */
    @Field(() => String)
    runId!: string

    /** The address probed. */
    @Field(() => String)
    url!: string

    /** Whether every probe passed. */
    @Field(() => Boolean)
    passed!: boolean

    /** Each probe. */
    @Field(() => [ProjectProbeResultType])
    results!: ReadonlyArray<ProjectProbeResultType>

    /** When it ran, as an ISO 8601 instant. */
    @Field(() => String)
    at!: string
}
