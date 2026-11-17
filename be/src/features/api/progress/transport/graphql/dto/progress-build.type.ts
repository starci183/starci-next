import { Field, Int, ObjectType } from "@nestjs/graphql"
import { ProgressStageType } from "./progress-stage.type"

@ObjectType()
/** One harness build. */
export class ProgressBuildType {
    /** The build id. */
    @Field(() => String)
    buildId!: string

    /** The title. */
    @Field(() => String)
    title!: string

    /** none, practising or proved. */
    @Field(() => String)
    state!: string

    /** Stages proved. */
    @Field(() => Int)
    stagesProved!: number

    /** Stages with machine results only. */
    @Field(() => Int)
    stagesPractising!: number

    /** Stages in the build. */
    @Field(() => Int)
    stagesTotal!: number

    /** The stages in order. */
    @Field(() => [ProgressStageType])
    stages!: Array<ProgressStageType>
}
