import { Field, Int, ObjectType } from "@nestjs/graphql"
import { HarnessKeyNeedType } from "./harness-key-need.type"
import { HarnessRuntimeType } from "./harness-runtime.type"
import { HarnessRepositoryType } from "./harness-repository.type"
import { HarnessStageType } from "./harness-stage.type"

@ObjectType()
/** A build with its runtime, binding and stages. */
export class HarnessBuildType {
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

    /** How it runs. */
    @Field(() => HarnessRuntimeType)
    runtime!: HarnessRuntimeType

    /** The binding. */
    @Field(() => HarnessRepositoryType)
    repository!: HarnessRepositoryType

    /** The stages. */
    @Field(() => [HarnessStageType])
    stages!: Array<HarnessStageType>
}
