import { Field, Int, ObjectType } from "@nestjs/graphql"
import { HarnessProbeResultType } from "./harness-probe-result.type"

@ObjectType()
/** The doctor of one tool: its probes and how many passed. */
export class HarnessDoctorType {
    /** claude or codex. */
    @Field(() => String)
    tool!: string

    /** The probes. */
    @Field(() => [HarnessProbeResultType])
    probes!: Array<HarnessProbeResultType>

    /** How many passed. */
    @Field(() => Int)
    passed!: number

    /** How many there are. */
    @Field(() => Int)
    total!: number
}
