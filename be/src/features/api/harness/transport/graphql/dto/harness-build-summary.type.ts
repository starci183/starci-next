import { Field, Int, ObjectType } from "@nestjs/graphql"
import { HarnessKeyNeedType } from "./harness-key-need.type"

@ObjectType()
/** A build in the list with its progress. */
export class HarnessBuildSummaryType {
    /** The build id. */
    @Field(() => String)
    id!: string

    /** The position. */
    @Field(() => Int)
    order!: number

    /** The title. */
    @Field(() => String)
    title!: string

    /** The summary. */
    @Field(() => String)
    summary!: string

    /** The key needs. */
    @Field(() => [HarnessKeyNeedType])
    keys!: Array<HarnessKeyNeedType>

    /** The number of stages. */
    @Field(() => Int)
    stageCount!: number

    /** Stages at least practising. */
    @Field(() => Int)
    practisingStages!: number

    /** Stages proved. */
    @Field(() => Int)
    provedStages!: number

    /** NONE, PRACTISING or PROVED. */
    @Field(() => String)
    state!: string
}
