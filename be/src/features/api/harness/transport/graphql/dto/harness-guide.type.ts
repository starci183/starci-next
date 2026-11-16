import { Field, Int, ObjectType } from "@nestjs/graphql"
import { HarnessTextType } from "./harness-text.type"
import { HarnessProbeResultType } from "./harness-probe-result.type"

@ObjectType()
/** A guide with its sections and the probes that check it. */
export class HarnessGuideType {
    /** claude or codex. */
    @Field(() => String)
    tool!: string

    /** The slug. */
    @Field(() => String)
    slug!: string

    /** The position. */
    @Field(() => Int)
    order!: number

    /** The title. */
    @Field(() => String)
    title!: string

    /** The summary. */
    @Field(() => String)
    summary!: string

    /** The sections. */
    @Field(() => [HarnessTextType])
    sections!: Array<HarnessTextType>

    /** The probes of the guide. */
    @Field(() => [HarnessProbeResultType])
    probes!: Array<HarnessProbeResultType>
}
